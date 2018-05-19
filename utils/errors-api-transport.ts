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

import {Configuration} from '../src/configuration';
import {RequestHandler as AuthClient} from '../src/google-apis/auth-client';
import * as types from '../src/types';

export interface ServiceContext {
  service: string;
  version: string;
  resourceType: string;
}

export interface ErrorEvent {
  eventTime: string;
  serviceContext: ServiceContext;
  message: string;
  // other fields not used in the tests have been omitted
}

export interface ErrorGroupStats {
  representative: ErrorEvent;
  count: string;
  // other fields not used in the tests have been omitted
}

export interface GroupStatesResponse {
  errorGroupStats: ErrorGroupStats[];
  nextPageToken: string;
  timeRangeBegin: string;
}

/* @const {String} Base Error Reporting API */
const API = 'https://clouderrorreporting.googleapis.com/v1beta1/projects';

const ONE_HOUR_API = 'timeRange.period=PERIOD_1_HOUR';

export class ErrorsApiTransport extends AuthClient {
  constructor(config: Configuration, logger: types.Logger) {
    super(config, logger);
  }

  deleteAllEvents(cb: (err: Error|null) => void) {
    const self = this;
    self.getProjectId((err, id) => {
      if (err) {
        return cb(err);
      }

      const options = {uri: [API, id, 'events'].join('/'), method: 'DELETE'};
      self.request_(options, (err, response, body) => {
        if (err) {
          return cb(err);
        }
        cb(null);
      });
    });
  }

  getAllGroups(cb: (err: Error|null, data?: ErrorGroupStats[]) => void) {
    const self = this;
    self.getProjectId((err, id) => {
      if (err) {
        return cb(err);
      }

      const options = {
        uri: [API, id, 'groupStats?' + ONE_HOUR_API].join('/'),
        method: 'GET'
      };
      self.request_(options, (err, response, body) => {
        if (err) {
          return cb(err);
        }

        cb(null, JSON.parse(body.body).errorGroupStats || []);
      });
    });
  }
}
