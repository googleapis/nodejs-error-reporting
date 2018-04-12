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
// jscs:disable requireEarlyReturn

import has = require('lodash.has');
import * as is from 'is';
const isObject = is.object;
const isFunction = is.function;
const isArray = is.array;
import {RequestInformationContainer} from '../classes/request-information-container';
import * as hapi from 'hapi';

/**
 * This function is used to check for a pending status code on the response
 * or a set status code on the response.output object property. If neither of
 * these properties can be found then -1 will be returned as the output.
 * @function attemptToExtractStatusCode
 * @param {Object} req - the request information object to extract from
 * @returns {Number} - Either an HTTP status code or -1 in absence of an
 *  extractable status code.
 */
function attemptToExtractStatusCode(req: hapi.Request) {
  // TODO: Handle the cases where `req.response` and `req.response.output`
  //       are `null` in this function
  if (has(req, 'response') && isObject(req.response) &&
      has(req.response, 'statusCode')) {
    return req.response!.statusCode;
  } else if (
      has(req, 'response') && isObject(req.response) &&
      isObject(req.response!.output)) {
    return req.response!.output!.statusCode;
  }

  return 0;
}

/**
 * This function is used to check for the x-forwarded-for header first to
 * identify source IP connnections. If this header is not present, then the
 * function will attempt to extract the remoteAddress from the request.info
 * object property. If neither of these properties can be found then an empty
 * string will be returned.
 * @function extractRemoteAddressFromRequest
 * @param {Object} req - the request information object to extract from
 * @returns {String} - Either an empty string if the IP cannot be extracted or
 *  a string that represents the remote IP address
 */
function extractRemoteAddressFromRequest(req: hapi.Request) {
  if (has(req.headers, 'x-forwarded-for')) {
    return req.headers['x-forwarded-for'];
  } else if (isObject(req.info)) {
    return req.info.remoteAddress;
  }

  return '';
}

/**
 * This function is used to extract request information from a hapi request
 * object. This function will not check for the presence of properties on the
 * request object.
 * @function hapiRequestInformationExtractor
 * @param {Object} req - the hapi request object to extract from
 * @returns {RequestInformationContainer} - an object containing the request
 *  information in a standardized format
 */
export function hapiRequestInformationExtractor(req?: hapi.Request) {
  const returnObject = new RequestInformationContainer();

  if (!isObject(req) || !isObject(req!.headers) || isFunction(req) ||
      isArray(req)) {
    return returnObject;
  }

  returnObject
      .setMethod(req!.method)
      // TODO: Address the type conflict that requires a cast to string
      .setUrl(req!.url as {} as string)
      .setUserAgent(req!.headers['user-agent'])
      .setReferrer(req!.headers.referrer)
      .setStatusCode(attemptToExtractStatusCode(req!))
      .setRemoteAddress(extractRemoteAddressFromRequest(req!));

  return returnObject;
}
