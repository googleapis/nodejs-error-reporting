/**
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

var assert = require('assert');
var nock = require('nock');
var RequestHandler = require('../src/google-apis/auth-client.js');
var ErrorsApiTransport = require('../utils/errors-api-transport.js');
var ErrorMessage = require('../src/classes/error-message.js');
var Configuration = require('../test/fixtures/configuration.js');
var createLogger = require('../src/logger.js');
var is = require('is');
var isObject = is.object;
var isString = is.string;
var isEmpty = is.empty;
var forEach = require('lodash.foreach');
var assign = require('lodash.assign');
var pick = require('lodash.pick');
var omitBy = require('lodash.omitby');
// eslint-disable-next-line node/no-extraneous-require
var request = require('request');
var util = require('util');
var path = require('path');

const ERR_TOKEN = '_@google_STACKDRIVER_INTEGRATION_TEST_ERROR__';
const TIMEOUT = 30000;

const envKeys = [
  'GOOGLE_APPLICATION_CREDENTIALS',
  'GCLOUD_PROJECT',
  'NODE_ENV',
];

class InstancedEnv {
  constructor(injectedEnv) {
    assign(this, injectedEnv);
    this.injectedEnv = injectedEnv;
    this._originalEnv = this._captureProcessProperties();
  }

  _captureProcessProperties() {
    return omitBy(pick(process.env, envKeys), value => !isString(value));
  }

  sterilizeProcess() {
    forEach(envKeys, (v, k) => delete process.env[k]);
    return this;
  }

  setProjectId() {
    assign(process.env, {
      GCLOUD_PROJECT: this.injectedEnv.projectId,
    });
    return this;
  }

  setProjectNumber() {
    assign(process.env, {
      GCLOUD_PROJECT: this.injectedEnv.projectNumber,
    });
    return this;
  }

  setKeyFilename() {
    assign(process.env, {
      GOOGLE_APPLICATION_CREDENTIALS: this.injectedEnv.keyFilename,
    });
    return this;
  }

  setProduction() {
    assign(process.env, {
      NODE_ENV: 'production',
    });
    return this;
  }

  restoreProcessToOriginalState() {
    assign(process.env, this._originalEnv);
    return this;
  }

  injected() {
    return assign({}, this.injectedEnv);
  }
}

// eslint-disable-next-line node/no-missing-require
const env = new InstancedEnv(require('../../../system-test/env.js'));

function shouldRun() {
  var shouldRun = true;
  if (!isString(env.injected().projectId)) {
    console.log('The project id (projectId) was not set in the env');
    shouldRun = false;
  }

  if (!isString(env.injected().apiKey)) {
    console.log('The api key (apiKey) was not set as an env variable');
    shouldRun = false;
  }

  if (!isString(env.injected().projectNumber)) {
    console.log('The project number (projectNumber) was not set in the env');
    shouldRun = false;
  }

  if (!isString(env.injected().keyFilename)) {
    console.log('The key filename (keyFilename) was not set in the env');
    shouldRun = false;
  }

  return shouldRun;
}

if (!shouldRun()) {
  console.log('Skipping error-reporting system tests');
  // eslint-disable-next-line no-process-exit
  process.exit(1);
}

describe('Request/Response lifecycle mocking', function() {
  var sampleError = new Error(ERR_TOKEN);
  var errorMessage = new ErrorMessage().setMessage(sampleError);
  var fakeService, client, logger;
  before(function() {
    env.sterilizeProcess();
  });

  beforeEach(function() {
    env
      .setProjectId()
      .setKeyFilename()
      .setProduction();
    fakeService = nock(
      'https://clouderrorreporting.googleapis.com/v1beta1/projects/' +
        process.env.GCLOUD_PROJECT
    )
      .persist()
      .post('/events:report');
    logger = createLogger({logLevel: 5});
    client = new RequestHandler(
      new Configuration({ignoreEnvironmentCheck: true}, logger),
      logger
    );
  });

  afterEach(function() {
    env.sterilizeProcess();
    nock.cleanAll();
  });

  after(function() {
    env.restoreProcessToOriginalState();
  });

  it('Should fail when receiving non-retryable errors', function(done) {
    this.timeout(5000);
    client.sendError({}, function(err, response) {
      assert(err instanceof Error);
      assert.strictEqual(err.message.toLowerCase(), 'message cannot be empty.');
      assert(isObject(response));
      assert.strictEqual(response.statusCode, 400);
      done();
    });
  });

  it('Should retry when receiving retryable errors', function(done) {
    this.timeout(25000);
    var tries = 0;
    var intendedTries = 4;
    fakeService.reply(429, function() {
      tries += 1;
      console.log('Mock Server Received Request:', tries + '/' + intendedTries);
      return {error: 'Please try again later'};
    });
    client.sendError(errorMessage, function() {
      assert.strictEqual(tries, intendedTries);
      done();
    });
  });

  it(
    'Should provide the key as a query string on outgoing requests when ' +
      'using an API key',
    function(done) {
      env
        .sterilizeProcess()
        .setProjectId()
        .setProduction();
      var key = env.apiKey;
      var client = new RequestHandler(
        new Configuration(
          {key: key, ignoreEnvironmentCheck: true},
          createLogger({logLevel: 5})
        )
      );
      fakeService.query({key: key}).reply(200, function(uri) {
        assert(uri.indexOf('key=' + key) > -1);
        return {};
      });
      client.sendError(errorMessage, function() {
        done();
      });
    }
  );

  it('Should still execute the request with a callback-less invocation', function(
    done
  ) {
    fakeService.reply(200, function() {
      done();
    });
    client.sendError(errorMessage);
  });
});

describe('Client creation', function() {
  var sampleError = new Error(ERR_TOKEN);
  var errorMessage = new ErrorMessage().setMessage(sampleError.stack);
  after(function() {
    env.sterilizeProcess();
  });

  it(
    'Should not throw on initialization when using only project id as a ' +
      'runtime argument',
    function(done) {
      env.sterilizeProcess().setKeyFilename();
      var logger = createLogger({logLevel: 5});
      var cfg = new Configuration(
        {
          projectId: env.injected().projectId,
          ignoreEnvironmentCheck: true,
        },
        logger
      );
      this.timeout(10000);
      assert.doesNotThrow(function() {
        new RequestHandler(cfg, logger).sendError(errorMessage, function(
          err,
          response,
          body
        ) {
          assert.strictEqual(err, null);
          assert.strictEqual(response.statusCode, 200);
          assert(isObject(body) && isEmpty(body));
          done();
        });
      });
    }
  );

  it(
    'Should not throw on initialization when using only project id as an ' +
      'env variable',
    function(done) {
      env
        .sterilizeProcess()
        .setProjectId()
        .setKeyFilename();
      var logger = createLogger({logLevel: 5});
      var cfg = new Configuration({ignoreEnvironmentCheck: true}, logger);
      this.timeout(10000);
      assert.doesNotThrow(function() {
        new RequestHandler(cfg, logger).sendError(errorMessage, function(
          err,
          response,
          body
        ) {
          assert.strictEqual(err, null);
          assert.strictEqual(response.statusCode, 200);
          assert(isObject(body) && isEmpty(body));
          done();
        });
      });
    }
  );

  it(
    'Should not throw on initialization when using only project number as ' +
      'a runtime argument',
    function(done) {
      env.sterilizeProcess().setKeyFilename();
      var logger = createLogger({logLevel: 5});
      var cfg = new Configuration(
        {
          projectId: parseInt(env.injected().projectNumber),
          ignoreEnvironmentCheck: true,
        },
        logger
      );
      this.timeout(10000);
      assert.doesNotThrow(function() {
        new RequestHandler(cfg, logger).sendError(errorMessage, function(
          err,
          response,
          body
        ) {
          assert.strictEqual(err, null);
          assert.strictEqual(response.statusCode, 200);
          assert(isObject(body) && isEmpty(body));
          done();
        });
      });
    }
  );

  it(
    'Should not throw on initialization when using only project number as ' +
      'an env variable',
    function(done) {
      env
        .sterilizeProcess()
        .setKeyFilename()
        .setProjectNumber();
      var logger = createLogger({logLevel: 5});
      var cfg = new Configuration({ignoreEnvironmentCheck: true}, logger);
      this.timeout(10000);
      assert.doesNotThrow(function() {
        new RequestHandler(cfg, logger).sendError(errorMessage, function(
          err,
          response,
          body
        ) {
          assert.strictEqual(err, null);
          assert.strictEqual(response.statusCode, 200);
          assert(isObject(body) && isEmpty(body));
          done();
        });
      });
    }
  );
});

describe('Expected Behavior', function() {
  var ERROR_STRING = [
    'Stackdriver error reporting client has not been configured to send',
    'errors, please check the NODE_ENV environment variable and make',
    'sure it is set to "production" or set the ignoreEnvironmentCheck',
    'property to true in the runtime configuration object',
  ].join(' ');

  var er = new Error(ERR_TOKEN);
  var em = new ErrorMessage().setMessage(er.stack);

  after(function() {
    env.sterilizeProcess();
  });

  it('Should callback with an error with a configuration to not report errors', function(
    done
  ) {
    env
      .sterilizeProcess()
      .setKeyFilename()
      .setProjectId();
    process.env.NODE_ENV = 'null';
    var logger = createLogger({logLevel: 5});
    var client = new RequestHandler(
      new Configuration(undefined, logger),
      logger
    );
    client.sendError({}, function(err, response) {
      assert(err instanceof Error);
      assert.strictEqual(err.message, ERROR_STRING);
      assert.strictEqual(response, null);
      done();
    });
  });

  it('Should succeed in its request given a valid project id', function(done) {
    env.sterilizeProcess();
    var logger = createLogger({logLevel: 5});
    var cfg = new Configuration(
      {
        projectId: env.injected().projectId,
        ignoreEnvironmentCheck: true,
      },
      logger
    );
    var client = new RequestHandler(cfg, logger);

    client.sendError(em, function(err, response, body) {
      assert.strictEqual(err, null);
      assert(isObject(body));
      assert(isEmpty(body));
      assert.strictEqual(response.statusCode, 200);
      done();
    });
  });

  it('Should succeed in its request given a valid project number', function(
    done
  ) {
    env.sterilizeProcess();
    var logger = createLogger({logLevel: 5});
    var cfg = new Configuration(
      {
        projectId: parseInt(env.injected().projectNumber),
        ignoreEnvironmentCheck: true,
      },
      logger
    );
    var client = new RequestHandler(cfg, logger);
    client.sendError(em, function(err, response, body) {
      assert.strictEqual(err, null);
      assert(isObject(body));
      assert(isEmpty(body));
      assert.strictEqual(response.statusCode, 200);
      done();
    });
  });
});

describe('Error Reporting API', function() {
  [
    {
      name: 'when a valid API key is given',
      getKey: () => env.apiKey,
      message: 'Message cannot be empty.',
    },
    {
      name: 'when an empty API key is given',
      getKey: () => '',
      message: 'The request is missing a valid API key.',
    },
    {
      name: 'when an invalid API key is given',
      getKey: () => env.apiKey.slice(1) + env.apiKey[0],
      message: 'API key not valid. Please pass a valid API key.',
    },
  ].forEach(function(testCase) {
    it(`should return an expected message ${testCase.name}`, function(done) {
      this.timeout(30000);
      const API = 'https://clouderrorreporting.googleapis.com/v1beta1';
      const key = testCase.getKey();
      request.post(
        {
          url: `${API}/projects/${env.projectId}/events:report?key=${key}`,
          json: {},
        },
        (err, response, body) => {
          assert.ok(!err && body.error);
          assert.strictEqual(response.statusCode, 400);
          assert.strictEqual(body.error.message, testCase.message);
          done();
        }
      );
    });
  });
});

describe('error-reporting', function() {
  const SRC_ROOT = path.join(__dirname, '..', 'src');
  const TIMESTAMP = Date.now();
  const BASE_NAME = 'error-reporting-system-test';
  function buildName(suffix) {
    return [TIMESTAMP, BASE_NAME, suffix].join('_');
  }

  const SERVICE = buildName('service-name');
  const VERSION = buildName('service-version');

  var errors;
  var transport;
  var oldLogger;
  var logOutput = '';
  before(function() {
    // This test assumes that only the error-reporting library will be
    // adding listeners to the 'unhandledRejection' event.  Thus we need to
    // make sure that no listeners for that event exist.  If this check
    // fails, then the reinitialize() method below will need to updated to
    // more carefully reinitialize the error-reporting library without
    // interfering with existing listeners of the 'unhandledRejection' event.
    assert.strictEqual(process.listenerCount('unhandledRejection'), 0);
    oldLogger = console.log;
    console.log = function() {
      var text = util.format.apply(null, arguments);
      oldLogger(text);
      logOutput += text;
    };
    reinitialize();
  });

  function reinitialize(extraConfig) {
    process.removeAllListeners('unhandledRejection');
    var config = Object.assign(
      {
        ignoreEnvironmentCheck: true,
        serviceContext: {
          service: SERVICE,
          version: VERSION,
        },
      },
      extraConfig || {}
    );
    errors = require('../src/index.js')(config);
    transport = new ErrorsApiTransport(errors._config, errors._logger);
  }

  after(function(done) {
    console.log = oldLogger;
    if (transport) {
      transport.deleteAllEvents(function(err) {
        assert.ifError(err);
        done();
      });
    }
  });

  afterEach(function() {
    logOutput = '';
  });

  function verifyAllGroups(messageTest, timeout, cb) {
    setTimeout(function() {
      transport.getAllGroups(function(err, groups) {
        assert.ifError(err);
        assert.ok(groups);

        var matchedErrors = groups.filter(function(errItem) {
          return (
            errItem &&
            errItem.representative &&
            errItem.representative.serviceContext &&
            errItem.representative.serviceContext.service === SERVICE &&
            errItem.representative.serviceContext.version === VERSION &&
            messageTest(errItem.representative.message)
          );
        });

        cb(matchedErrors);
      });
    }, timeout);
  }

  function verifyServerResponse(messageTest, timeout, cb) {
    verifyAllGroups(messageTest, timeout, function(matchedErrors) {
      // The error should have been reported exactly once
      assert.strictEqual(matchedErrors.length, 1);
      var errItem = matchedErrors[0];
      assert.ok(errItem);
      assert.equal(errItem.count, 1);
      var rep = errItem.representative;
      assert.ok(rep);
      // Ensure the stack trace in the message does not contain any frames
      // specific to the error-reporting library.
      assert.strictEqual(rep.message.indexOf(SRC_ROOT), -1);
      // Ensure the stack trace in the mssage contains the frame corresponding
      // to the 'expectedTopOfStack' function because that is the name of
      // function used in this file that is the topmost function in the call
      // stack that is not internal to the error-reporting library.
      // This ensures that only the frames specific to the
      // error-reporting library are removed from the stack trace.
      assert.notStrictEqual(rep.message.indexOf('expectedTopOfStack'), -1);
      var context = rep.serviceContext;
      assert.ok(context);
      assert.strictEqual(context.service, SERVICE);
      assert.strictEqual(context.version, VERSION);
      cb();
    });
  }

  function verifyReporting(errOb, messageTest, timeout, cb) {
    (function expectedTopOfStack() {
      errors.report(errOb, function(err, response, body) {
        assert.ifError(err);
        assert(isObject(response));
        assert.deepEqual(body, {});
        verifyServerResponse(messageTest, timeout, cb);
      });
    })();
  }

  // For each test below, after an error is reported, the test waits
  // TIMEOUT ms before verifying the error has been reported to ensure
  // the system had enough time to receive the error report and process it.
  // As such, each test is set to fail due to a timeout only if sufficiently
  // more than TIMEOUT ms has elapsed to avoid test fragility.

  it('Should correctly publish an error that is an Error object', function verifyErrors(
    done
  ) {
    this.timeout(TIMEOUT * 2);
    var errorId = buildName('with-error-constructor');
    var errOb = (function expectedTopOfStack() {
      return new Error(errorId);
    })();
    verifyReporting(
      errOb,
      function(message) {
        return message.startsWith('Error: ' + errorId + '\n');
      },
      TIMEOUT,
      done
    );
  });

  it('Should correctly publish an error that is a string', function(done) {
    this.timeout(TIMEOUT * 2);
    var errorId = buildName('with-string');
    verifyReporting(
      errorId,
      function(message) {
        return message.startsWith(errorId + '\n');
      },
      TIMEOUT,
      done
    );
  });

  it('Should correctly publish an error that is undefined', function(done) {
    this.timeout(TIMEOUT * 2);
    verifyReporting(
      undefined,
      function(message) {
        return message.startsWith('undefined\n');
      },
      TIMEOUT,
      done
    );
  });

  it('Should correctly publish an error that is null', function(done) {
    this.timeout(TIMEOUT * 2);
    verifyReporting(
      null,
      function(message) {
        return message.startsWith('null\n');
      },
      TIMEOUT,
      done
    );
  });

  it('Should correctly publish an error that is a plain object', function(
    done
  ) {
    this.timeout(TIMEOUT * 2);
    verifyReporting(
      {someKey: 'someValue'},
      function(message) {
        return message.startsWith('[object Object]\n');
      },
      TIMEOUT,
      done
    );
  });

  it('Should correctly publish an error that is a number', function(done) {
    this.timeout(TIMEOUT * 2);
    var num = new Date().getTime();
    verifyReporting(
      num,
      function(message) {
        return message.startsWith('' + num + '\n');
      },
      TIMEOUT,
      done
    );
  });

  it('Should correctly publish an error that is of an unknown type', function(
    done
  ) {
    this.timeout(TIMEOUT * 2);
    var bool = true;
    verifyReporting(
      bool,
      function(message) {
        return message.startsWith('true\n');
      },
      TIMEOUT,
      done
    );
  });

  it('Should correctly publish errors using an error builder', function(done) {
    this.timeout(TIMEOUT * 2);
    var errorId = buildName('with-error-builder');
    // Use an IIFE with the name `definitionSiteFunction` to use later to ensure
    // the stack trace of the point where the error message was constructed is
    // used.
    // Use an IIFE with the name `expectedTopOfStack` so that the test can
    // verify that the stack trace used does not contain any frames
    // specific to the error-reporting library.
    var errOb = (function definitionSiteFunction() {
      return (function expectedTopOfStack() {
        return errors.event().setMessage(errorId);
      })();
    })();
    (function callingSiteFunction() {
      verifyReporting(
        errOb,
        function(message) {
          // Verify that the stack trace of the constructed error
          // uses the stack trace at the point where the error was constructed
          // and not the stack trace at the point where the `report` method
          // was called.
          return (
            message.startsWith(errorId) &&
            message.indexOf('callingSiteFunction') === -1 &&
            message.indexOf('definitionSiteFunction') !== -1
          );
        },
        TIMEOUT,
        done
      );
    })();
  });

  it('Should report unhandledRejections if enabled', function(done) {
    this.timeout(TIMEOUT * 2);
    reinitialize({reportUnhandledRejections: true});
    var rejectValue = buildName('promise-rejection');
    (function expectedTopOfStack() {
      // An Error is used for the rejection value so that it's stack
      // contains the stack trace at the point the rejection occured and is
      // rejected within a function named `expectedTopOfStack` so that the
      // test can verify that the collected stack is correct.
      Promise.reject(new Error(rejectValue));
    })();
    var rejectText = 'Error: ' + rejectValue;
    setImmediate(function() {
      var expected =
        'UnhandledPromiseRejectionWarning: Unhandled ' +
        'promise rejection: ' +
        rejectText +
        '.  This rejection has been reported to the ' +
        'Google Cloud Platform error-reporting console.';
      assert.notStrictEqual(logOutput.indexOf(expected), -1);
      verifyServerResponse(
        function(message) {
          return message.startsWith(rejectText);
        },
        TIMEOUT,
        done
      );
    });
  });

  it('Should not report unhandledRejections if disabled', function(done) {
    this.timeout(TIMEOUT * 2);
    reinitialize({reportUnhandledRejections: false});
    var rejectValue = buildName('promise-rejection');
    (function expectedTopOfStack() {
      Promise.reject(rejectValue);
    })();
    setImmediate(function() {
      var notExpected =
        'UnhandledPromiseRejectionWarning: Unhandled ' +
        'promise rejection: ' +
        rejectValue +
        '.  This rejection has been reported to the error-reporting console.';
      assert.strictEqual(logOutput.indexOf(notExpected), -1);
      // Get all groups that that start with the rejection value and hence all
      // of the groups corresponding to the above rejection (Since the
      // buildName() creates a string unique enough to single out only the
      // above rejection.) and verify that there are no such groups reported.
      verifyAllGroups(
        function(message) {
          return message.startsWith(rejectValue);
        },
        TIMEOUT,
        function(matchedErrors) {
          assert.strictEqual(matchedErrors.length, 0);
          done();
        }
      );
    });
  });
});
