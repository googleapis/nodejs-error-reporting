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

import * as is from 'is';
import has = require('lodash.has');
import {RequestInformationContainer} from '../classes/request-information-container';

export interface Request {
  method?: string;
  url?: string;
  userAgent?: string;
  referrer?: string;
  statusCode?: number;
  remoteAddress?: string;
}

/**
 * The manualRequestInformationExtractor is meant to take a standard object
 * and extract request information based on the inclusion of several properties.
 * This function will check the presence of properties before attempting to
 * access them on the object but it will not attempt to check for these
 * properties types as this is allocated to the RequestInformationContainer.
 * @function manualRequestInformationExtractor
 * @param {Object} req - the request information object to extract from
 * @param {String} [req.method] - the request method (ex GET, PUT, POST, DELETE)
 * @param {String} [req.url] - the request url
 * @param {String} [req.userAgent] - the requesters user-agent
 * @param {String} [req.referrer] - the requesters referrer
 * @param {Number} [req.statusCode] - the status code given in response to the
 *  request
 * @param {String} [req.remoteAddress] - the remote address of the requester
 * @returns {RequestInformationContainer} - an object containing the request
 *  information in a standardized format
 */
export function manualRequestInformationExtractor(req: Request) {
  const returnObject = new RequestInformationContainer();

  if (!is.object(req) || is.array(req) || is.function(req)) {
    return returnObject;
  }

  if (has(req, 'method')) {
    returnObject.setMethod(req.method!);
  }

  if (has(req, 'url')) {
    returnObject.setUrl(req.url!);
  }

  if (has(req, 'userAgent')) {
    returnObject.setUserAgent(req.userAgent);
  }

  if (has(req, 'referrer')) {
    returnObject.setReferrer(req.referrer);
  }

  if (has(req, 'statusCode')) {
    returnObject.setStatusCode(req.statusCode!);
  }

  if (has(req, 'remoteAddress')) {
    returnObject.setRemoteAddress(req.remoteAddress);
  }

  return returnObject;
}
