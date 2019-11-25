// Copyright 2016 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import * as http from 'http';
import * as is from 'is';

import {ErrorMessage} from '../classes/error-message';
import {Configuration, Logger} from '../configuration';
import {RequestHandler} from '../google-apis/auth-client';
import {populateErrorMessage} from '../populate-error-message';
import {manualRequestInformationExtractor} from '../request-extractors/manual';
import {Request} from '../request-extractors/manual';

export type Callback = (
  err: Error | null,
  response: http.ServerResponse | null,
  body: {}
) => void;

// tslint:disable-next-line:no-any
type AnyError = any;

/**
 * The handler setup function serves to produce a bound instance of the
 * reportManualError function with no bound context, a bound first arugment
 * which is intended to be an initialized instance of the API client and a bound
 * second argument which is the environmental configuration.
 * @function handlerSetup
 * @param {AuthClient} client - an initialized API client
 * @param {NormalizedConfigurationVariables} config - the environmental
 *  configuration
 * @param {Object} logger - The logger instance created when the library API has
 *  been initialized.
 * @returns {reportManualError} - a bound version of the reportManualError
 *  function
 */
export function handlerSetup(
  client: RequestHandler,
  config: Configuration,
  logger: Logger
) {
  /**
   * The interface for manually reporting errors to the Google Error API in
   * application code.
   * @param {Any|ErrorMessage} err - error information of any type or content.
   *  This can be of any type but by giving an instance of ErrorMessage as the
   *  error arugment one can manually provide values to all fields of the
   *  potential payload.
   * @param {Object} [request] - an object containing request information. This
   *  is expected to be an object similar to the Node/Express request object.
   * @param {String} [additionalMessage] - a string containing error message
   *  information to override the builtin message given by an Error/Exception
   * @param {Function} [callback] - a callback to be invoked once the message
   *  has been successfully submitted to the error reporting API or has failed
   *  after four attempts with the success or error response.
   * @returns {ErrorMessage} - returns the error message created through with
   * the parameters given.
   */
  function reportManualError(err: AnyError): ErrorMessage;
  function reportManualError(err: AnyError, request: Request): ErrorMessage;
  function reportManualError(
    err: AnyError,
    additionalMessage: string
  ): ErrorMessage;
  function reportManualError(err: AnyError, callback: Callback): ErrorMessage;
  function reportManualError(
    err: AnyError,
    request: Request,
    callback: Callback
  ): ErrorMessage;
  function reportManualError(
    err: AnyError,
    request: Request,
    additionalMessage: string
  ): ErrorMessage;
  function reportManualError(
    err: AnyError,
    additionalMessage: string,
    callback: Callback
  ): ErrorMessage;
  function reportManualError(
    err: AnyError,
    request: Request,
    additionalMessage: string,
    callback: Callback
  ): ErrorMessage;
  function reportManualError(
    err: AnyError,
    request?: Request | Callback | string,
    additionalMessage?: Callback | string | {},
    callback?: Callback | {} | string
  ): ErrorMessage {
    let em;
    if (is.string(request)) {
      // no request given
      callback = additionalMessage;
      additionalMessage = request;
      request = undefined;
    } else if (is.function(request)) {
      // neither request nor additionalMessage given
      callback = request;
      request = undefined;
      additionalMessage = undefined;
    }

    if (is.function(additionalMessage)) {
      callback = additionalMessage;
      additionalMessage = undefined;
    }

    if (err instanceof ErrorMessage) {
      // The API expects the error to contain a stack trace.  Thus we
      // append the stack trace of the point where the error was
      // constructed. See the `message-builder.js` file for more details.
      const stackErr = err as ErrorMessage & {_autoGeneratedStackTrace: string};
      if (stackErr._autoGeneratedStackTrace) {
        err.setMessage(err.message + '\n' + stackErr._autoGeneratedStackTrace);
        // Delete the property so that if the ErrorMessage is reported a
        // second time, the stack trace is not appended a second time. Also,
        // the API will not accept the ErrorMessage if it has additional
        // properties.
        delete stackErr._autoGeneratedStackTrace;
      } else {
        logger.warn(
          'Encountered a manually constructed error with message "' +
            err.message +
            '" but without a construction site ' +
            'stack trace.  This error might not be visible in the ' +
            'error reporting console.'
        );
      }
      em = err;
    } else {
      em = new ErrorMessage();
      em.setServiceContext(
        config.getServiceContext().service,
        config.getServiceContext().version
      );
      populateErrorMessage(err, em);
    }

    if (is.object(request)) {
      // TODO: Address this explicit cast
      em.consumeRequestInformation(
        manualRequestInformationExtractor(request as Request)
      );
    }

    if (is.string(additionalMessage)) {
      em.setMessage(additionalMessage as string);
    }

    // TODO: Address this type cast
    client.sendError(em, callback as Callback);
    return em;
  }

  return reportManualError;
}
