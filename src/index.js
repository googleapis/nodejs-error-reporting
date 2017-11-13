/*!
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

/*!
 * @module error-reporting
 */

'use strict';

var Configuration = require('./configuration.js');
var AuthClient = require('./google-apis/auth-client.js');
// Begin error reporting interfaces

var koa = require('./interfaces/koa.js');
var hapi = require('./interfaces/hapi.js');
var manual = require('./interfaces/manual.js');
var express = require('./interfaces/express.js');
var restify = require('./interfaces/restify');
var messageBuilder = require('./interfaces/message-builder.js');
var createLogger = require('./logger.js');

/**
 * @typedef ConfigurationOptions
 * @type {Object}
 * @property {String} [projectId] - the projectId of the project deployed
 * @property {String} [keyFilename] - path to a key file to use for an API key
 * @property {String|Number} logLevel - a integer between and including 0-5 or a
 *  decimal representation of an integer including and between 0-5 in String
 *  form
 * @property {String} [key] - API key to use for communication with the service
 * @property {uncaughtHandlingEnum}
 *  [onUncaughtException=uncaughtHandlingEnum.ignore] - one of the uncaught
 *  handling options
 * @property {Object} [serviceContext] - the service context of the application
 * @property {String} [serviceContext.service] - the service the application is
 *  running on
 * @property {String} [serviceContext.version] - the version the hosting
 *  application is currently labelled as
 * @property {Boolean} [ignoreEnvironmentCheck] - flag indicating whether or not
 *  to communicate errors to the Stackdriver service even if NODE_ENV is not set
 *  to production
 */

/**
 * @typedef Errors
 * @type {Object}
 * @property {Function} report - The manual interface to report Errors to the
 *  Stackdriver Error Reporting Service
 * @property {ErrorMessage} event - Returns a new ErrorMessage class instance
 *  to use to create custom messages
 * @property {Function} express - The express plugin for Stackdriver Error
 *  Reporting
 * @property {Object} hapi - The hapi plugin for Stackdriver Error Reporting
 * @property {Function} koa - The koa plugin for Stackdriver Error Reporting
 * @property {Function} restify - The restify plugin for Stackdriver Error
 *  Reporting
 */

/**
 * This module provides Stackdriver Error Reporting support for Node.js
 * applications.
 * [Stackdriver Error Reporting](https://cloud.google.com/error-reporting/) is
 * a feature of Google Cloud Platform that allows in-depth monitoring and
 * viewing of errors reported by applications running in almost any environment.
 *
 * This is the entry point for initializing the error reporting middleware. This
 * function will invoke configuration gathering and attempt to create a API
 * client which will send errors to the Error Reporting Service.
 *
 * @alias module:error-reporting
 * @constructor
 *
 * @resource [What is Stackdriver Error Reporting]{@link
 * https://cloud.google.com/error-reporting/}
 *
 * @param {ConfigurationOptions} initConfiguration - The desired project/error
 *     reporting configuration.
 */
function Errors(initConfiguration) {
  if (!(this instanceof Errors)) {
    return new Errors(initConfiguration);
  }

  this._logger = createLogger(initConfiguration);
  this._config = new Configuration(initConfiguration, this._logger);
  this._client = new AuthClient(this._config, this._logger);

  // Build the application interfaces for use by the hosting application
  /**
   * @example
   * // Use to report errors manually like so
   * errors.report(new Error('xyz'), function () {
   *  console.log('done!');
   * });
   */
  this.report = manual(this._client, this._config, this._logger);
  /**
   * @example
   * // Use to create and report errors manually with a high-degree
   * // of manual control
   * var err = errors.event()
   *  .setMessage('My error message')
   *  .setUser('root@nexus');
   * errors.report(err, function () {
   *  console.log('done!');
   * });
   */
  this.event = messageBuilder(this._config);
  /**
   * @example
   * var hapi = require('hapi');
   * var server = new hapi.Server();
   * server.connection({ port: 3000 });
   * server.start();
   * // AFTER ALL OTHER ROUTE HANDLERS
   * server.register({register: errors.hapi});
   */
  this.hapi = hapi(this._client, this._config);
  /**
   * @example
   * var express = require('express');
   * var app = express();
   * // AFTER ALL OTHER ROUTE HANDLERS
   * app.use(errors.express);
   * app.listen(3000);
   */
  this.express = express(this._client, this._config);
  /**
   * @example
   * var restify = require('restify');
   * var server = restify.createServer();
   * // BEFORE ALL OTHER ROUTE HANDLERS
   * server.use(errors.restify(server));
   */
  this.restify = restify(this._client, this._config);
  /**
   * @example
   * var koa = require('koa');
   * var app = koa();
   * // BEFORE ALL OTHER ROUTE HANDLERS HANDLERS
   * app.use(errors.koa);
   */
  this.koa = koa(this._client, this._config);

  if (this._config.getReportUnhandledRejections()) {
    var that = this;
    process.on('unhandledRejection', function(reason) {
      that._logger.log(
        'UnhandledPromiseRejectionWarning: ' +
          'Unhandled promise rejection: ' +
          reason +
          '.  This rejection has been reported to the ' +
          'Google Cloud Platform error-reporting console.'
      );
      that.report(reason);
    });
  }
}

module.exports = Errors;
