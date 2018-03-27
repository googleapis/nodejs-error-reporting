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

import * as assert from 'assert';
import {createLogger} from '../../src/logger';

describe('logger', function() {
  describe('Initialization', function() {
    let oldEnv;
    before(function() {
      oldEnv = process.env.GCLOUD_ERRORS_LOGLEVEL;
      delete process.env.GCLOUD_ERRORS_LOGLEVEL;
    });
    after(function() {
      process.env.GCLOUD_ERRORS_LOGLEVEL = oldEnv;
    });
    describe('Exception handling', function() {
      it('Should not throw given undefined', function() {
        assert.doesNotThrow(createLogger,
          createLogger() as {} as (err: Error) => boolean);
      });
      it('Should not throw given an empty object', function() {
        assert.doesNotThrow(createLogger.bind(null, {}),
          createLogger() as {} as (err: Error) => boolean);
      });
      it('Should not throw given logLevel as a number', function() {
        assert.doesNotThrow(
            createLogger.bind(null, {logLevel: 3}),
            createLogger({logLevel: 3}) as {} as (err: Error) => boolean);
      });
      it('Should not throw given logLevel as a string', function() {
        assert.doesNotThrow(
            createLogger.bind(null, {logLevel: '3'}),
            createLogger({logLevel: 3}) as {} as (err: Error) => boolean);
      });
      it('Should not throw given an env variable to use', function() {
        process.env.GCLOUD_ERRORS_LOGLEVEL = '4';
        assert.doesNotThrow(createLogger,
          createLogger({logLevel: 4}) as {} as (err: Error) => boolean);
        delete process.env.GCLOUD_ERRORS_LOGLEVEL;
      });
      it('Should thow given logLevel as null', function() {
        assert.throws(createLogger.bind(null, {logLevel: null}), undefined);
      });
    });
    describe('Default log level', function() {
      let oldLog;
      let text;
      beforeEach(function() {
        // eslint-disable-next-line no-console
        oldLog = console.log;
        text = '';
        // eslint-disable-next-line no-console
        console.log = function() {
          oldLog.apply(this, arguments);
          for (let i = 0; i < arguments.length; i++) {
            text += arguments[i];
          }
        };
      });
      afterEach(function() {
        text = undefined;
        // eslint-disable-next-line no-console
        console.log = oldLog;
      });
      it('Should print WARN logs by default', function() {
        const logger = createLogger();
        logger.warn('test warning message');
        assert.strictEqual(
            text, 'WARN:@google-cloud/error-reporting: test warning message');
      });
      it('Should print ERROR logs by default', function() {
        const logger = createLogger();
        logger.error('test error message');
        assert.strictEqual(
            text, 'ERROR:@google-cloud/error-reporting: test error message');
      });
    });
  });
});
