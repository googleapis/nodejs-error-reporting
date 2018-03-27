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

import {RequestHandler as AuthClient} from '../src/google-apis/auth-client';

/* @const {String} Base Error Reporting API */
const API = 'https://clouderrorreporting.googleapis.com/v1beta1/projects';

const ONE_HOUR_API = 'timeRange.period=PERIOD_1_HOUR';

export class ErrorsApiTransport extends AuthClient {
  constructor(config, logger) {
    super(config, logger);
  }

  deleteAllEvents(cb) {
    const self = this;
    self.getProjectId(function(err, id) {
      if (err) {
        return cb(err);
      }

      const options = {
        uri: [API, id, 'events'].join('/'),
        method: 'DELETE'
      };
      self.request_(options, function(
        err,
        /* jshint unused:false */ response,
        /* jshint unused:false */ body
      ) {
        if (err) {
          return cb(err);
        }

        cb(null);
      });
    });
  }

  getAllGroups(cb) {
    const self = this;
    self.getProjectId(function(err, id) {
      if (err) {
        return cb(err);
      }

      const options = {
        uri: [API, id, 'groupStats?' + ONE_HOUR_API].join('/'),
        method: 'GET'
      };
      self.request_(options, function(err, response, body) {
        if (err) {
          return cb(err);
        }

        cb(null, JSON.parse(body.body).errorGroupStats || []);
      });
    });
  }
}
