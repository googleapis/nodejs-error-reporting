<img src="https://avatars2.githubusercontent.com/u/2810941?v=3&s=96" alt="Google Cloud Platform logo" title="Google Cloud Platform" align="right" height="96" width="96"/>

# Stackdriver Error Reporting: Node.js Client

[![release level](https://img.shields.io/badge/release%20level-beta-yellow.svg?style&#x3D;flat)](https://cloud.google.com/terms/launch-stages)
[![npm version](https://img.shields.io/npm/v/@google-cloud/error-reporting.svg)](https://www.npmjs.org/package/@google-cloud/error-reporting)
[![codecov](https://img.shields.io/codecov/c/github/googleapis/nodejs-error-reporting/master.svg?style=flat)](https://codecov.io/gh/googleapis/nodejs-error-reporting)

> Node.js idiomatic client for [Error Reporting][product-docs].

[Stackdriver Error Reporting](https://cloud.google.com/error-reporting/docs/) aggregates and displays errors produced in your running cloud services.

* [Error Reporting Documentation][product-docs]

Read more about the client libraries for Cloud APIs, including the older
Google APIs Client Libraries, in [Client Libraries Explained][explained].

[explained]: https://cloud.google.com/apis/docs/client-libraries-explained

**Table of contents:**

* [Overview](#overview)
* [Quickstart](#quickstart)
  * [Before you begin](#before-you-begin)
  * [Installing the client library](#installing-the-client-library)
  * [Using the client library](#using-the-client-library)
* [Samples](#samples)
* [Versioning](#versioning)
* [Contributing](#contributing)
* [License](#license)

## Overview

This module provides Stackdriver Error Reporting support for Node.js applications.
[Stackdriver Error Reporting](https://cloud.google.com/error-reporting/) is a feature of
Google Cloud Platform that allows in-depth monitoring and viewing of errors reported by
applications running in almost any environment.

![Stackdriver Error Reporting overview](doc/images/errors-overview.png)

Here's an introductory video that provides some more details:

[![Learn about Error Reporting in Stackdriver](https://img.youtube.com/vi/cVpWVD75Hs8/0.jpg)](https://www.youtube.com/watch?v=cVpWVD75Hs8)

Note that [@google-cloud/logging-winston](https://github.com/googleapis/nodejs-logging-winston) and
[@google-cloud/logging-bunyan](https://github.com/googleapis/nodejs-logging-bunyan) automatically integrate with the
Error Reporting service for Error objects logged at severity `error` or higher,
for applications running on Google Cloud Platform. If you are already using
Winston or Bunyan in your application, and don't need direct access/control of
error reporting, you may want to check those modules as well.

**Note:** The module will only send errors when the `NODE_ENV` environment variable is
set to `production` or the `ignoreEnvironmentCheck` property given in the
runtime configuration object is set to `true`.  See the [Configuration](#configuration) section for more details.

## Quickstart

### Before you begin

1.  Select or create a Cloud Platform project.

    [Go to the projects page][projects]

1.  Enable billing for your project.

    [Enable billing][billing]

1.  Enable the Stackdriver Error Reporting API.

    [Enable the API][enable_api]

1.  [Set up authentication with a service account][auth] so you can access the
    API from your local workstation.

[projects]: https://console.cloud.google.com/project
[billing]: https://support.google.com/cloud/answer/6293499#enable-billing
[enable_api]: https://console.cloud.google.com/flows/enableapi?apiid=clouderrorreporting.googleapis.com
[auth]: https://cloud.google.com/docs/authentication/getting-started

### Installing the client library

    npm install --save @google-cloud/error-reporting

### Using the client library

```javascript
  // Imports the Google Cloud client library

  // Node 6+
  const {ErrorReporting} = require('@google-cloud/error-reporting');

  // Using ES6 style imports via TypeScript or Babel
  // import {ErrorReporting} from '@google-cloud/error-reporting';

  // Instantiates a client
  const errors = new ErrorReporting();

  // Reports a simple error
  errors.report('Something broke!');
```

## Samples

Samples are in the [`samples/`](https://github.com/googleapis/nodejs-error-reporting/blob/master/samples) directory. The samples' `README.md`
has instructions for running the samples.

| Sample                      | Source Code                       |
| --------------------------- | --------------------------------- |
| Examples | [source code](https://github.com/googleapis/nodejs-error-reporting/blob/master/samples/snippets.js) |

## Configuration

The following code snippet lists all available configuration options.  All configuration options are optional.

```js
  // Node 6+
  const {ErrorReporting} = require('@google-cloud/error-reporting');

  // Using ES6 style imports via TypeScript or Babel
  // import {ErrorReporting} from '@google-cloud/error-reporting';

  // Instantiates a client
  const errors = new ErrorReporting({
    projectId: 'my-project-id',
    keyFilename: '/path/to/keyfile.json',
    credentials: require('./path/to/keyfile.json'),
    // if true library will attempt to report errors to the service regardless
    // of the value of NODE_ENV
    // defaults to false
    ignoreEnvironmentCheck: false,
    // determines the logging level internal to the library; levels range 0-5
    // where 0 indicates no logs should be reported and 5 indicates all logs
    // should be reported
    // defaults to 2 (warnings)
    logLevel: 2,
    // determines whether or not unhandled rejections are reported to the
    // error-reporting console
    reportUnhandledRejections: true,
    serviceContext: {
        service: 'my-service',
        version: 'my-service-version'
    }
  });
```

## Examples

### Reporting Manually

```js
  // Node 6+
  const {ErrorReporting} = require('@google-cloud/error-reporting');

  // Using ES6 style imports via TypeScript or Babel
  // import {ErrorReporting} from '@google-cloud/error-reporting';

  // Instantiates a client
  const errors = new ErrorReporting();

  // Use the error message builder to customize all fields ...
  const errorEvt = errors.event()
                       .setMessage('My error message')
                       .setUser('root@nexus');
  errors.report(errorEvt, () => console.log('done!'));

  // or just use a regular error ...
  errors.report(new Error('My error message'), () => console.log('done!'));

  // or one can even just use a string.
  errors.report('My error message');
```

The stack trace associated with an error can be viewed in the error reporting console.
* If the `errors.report` method is given an `ErrorMessage` object built using the `errors.event` method, the stack trace at the point where the error event was constructed will be used.
* If the `errors.report` method is given an `Error` object, the stack trace where the error was instantiated will be used.
* If the `errors.report` method is given a string, the stack trace at the point where `errors.report` is invoked will be used.

### Using Express

```js
  const express = require('express');

  // Node 6+
  const {ErrorReporting} = require('@google-cloud/error-reporting');

  // Using ES6 style imports via TypeScript or Babel
  // import {ErrorReporting} from '@google-cloud/error-reporting';

  // Instantiates a client
  const errors = new ErrorReporting();

  const app = express();

  app.get('/error', (req, res, next) => {
    res.send('Something broke!');
    next(new Error('Custom error message'));
  });

  app.get('/exception', () => {
    JSON.parse('{\"malformedJson\": true');
  });

  // Note that express error handling middleware should be attached after all
  // the other routes and use() calls. See [express docs][express-error-docs].
  app.use(errors.express);

  app.listen(3000);
```

### Using Hapi

```js
  const hapi = require('hapi');

  // Node 6+
  const {ErrorReporting} = require('@google-cloud/error-reporting');

  // Using ES6 style imports via TypeScript or Babel
  // import {ErrorReporting} from '@google-cloud/error-reporting';

  // Instantiates a client
  const errors = new ErrorReporting();

  const server = new hapi.Server();
  server.connection({ port: 3000 });
  server.start();

  server.route({
    method: 'GET',
    path: '/error',
    handler: (request, reply) => {
      reply('Something broke!');
      throw new Error('Custom error message');
    }
  });

  server.register(errors.hapi);
```

### Using Koa

```js
  const Koa = require('koa');

  // Node 6+
  const {ErrorReporting} = require('@google-cloud/error-reporting');

  // Using ES6 style imports via TypeScript or Babel
  // import {ErrorReporting} from '@google-cloud/error-reporting';

  // Instantiates a client
  const errors = new ErrorReporting();

  const app = new Koa();

  app.use(errors.koa);

  app.use(function *(next) {
    //This will set status and message
    this.throw('Error Message', 500);
  });

  // response
  app.use(function *(){
    this.body = 'Hello World';
  });

  app.listen(3000);
```

### Using Restify

```js
  const restify = require('restify');

  // Node 6+
  const {ErrorReporting} = require('@google-cloud/error-reporting');

  // Using ES6 style imports via TypeScript or Babel
  // import {ErrorReporting} from '@google-cloud/error-reporting';

  // Instantiates a client
  const errors = new ErrorReporting();

  function respond(req, res, next) {
    next(new Error('this is a restify error'));
  }

  const server = restify.createServer();

  server.use(errors.restify(server));
  server.get('/hello/:name', respond);
  server.head('/hello/:name', respond);

  server.listen(3000);
```

## Unhandled Rejections

Unhandled Rejections are not reported by default.  The reporting of unhandled rejections can be enabled using the `reportUnhandledRejections` configuration option.  See the [Configuration](#configuration) section for more details.

If unhandled rejections are set to be reported, then, when an unhandled rejection occurs, a message is printed to standard out indicated that an unhandled rejection had occurred and is being reported, and the value causing the rejection is reported to the error-reporting console.

## Catching and Reporting Application-wide Uncaught Errors

Uncaught exceptions are not reported by default.  *It is recommended to process `uncaughtException`s for production-deployed applications.*

Note that uncaught exceptions are not reported by default because to do so would require adding a listener to the `uncaughtException` event.  Adding such a listener without knowledge of other `uncaughtException` listeners can cause interference between the event handlers or prevent the process from terminating cleanly.  As such, it is necessary for `uncaughtException`s to be reported manually.

```js
  // Node 6+
  const {ErrorReporting} = require('@google-cloud/error-reporting');

  // Using ES6 style imports via TypeScript or Babel
  // import {ErrorReporting} from '@google-cloud/error-reporting';

  // Instantiates a client
  const errors = new ErrorReporting();

  process.on('uncaughtException', (e) => {
    // Write the error to stderr.
    console.error(e);
    // Report that same error the Stackdriver Error Service
    errors.report(e);
  });
```

More information about uncaught exception handling in Node.js and what it means for your application can be found [here](https://nodejs.org/api/process.html#process_event_uncaughtexception).

## Versioning

This library follows [Semantic Versioning](http://semver.org/).

This library is considered to be in **beta**. This means it is expected to be
mostly stable while we work toward a general availability release; however,
complete stability is not guaranteed. We will address issues and requests
against beta libraries with a high priority.

More Information: [Google Cloud Platform Launch Stages][launch_stages]

[launch_stages]: https://cloud.google.com/terms/launch-stages

## Contributing

Contributions welcome! See the [Contributing Guide](https://github.com/googleapis/nodejs-error-reporting/blob/master/CONTRIBUTING.md).

## License

Apache Version 2.0

See [LICENSE](https://github.com/googleapis/nodejs-error-reporting/blob/master/LICENSE)

[product-docs]: https://cloud.google.com/error-reporting/docs/

