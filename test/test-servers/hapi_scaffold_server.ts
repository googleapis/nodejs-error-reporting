/**
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as hapi from 'hapi';
import {ErrorReporting} from '../../src/index';
const errorHandler = new ErrorReporting();

const server = new hapi.Server();
server.connection({port: 3000});

// eslint-disable-next-line no-console
const log = console.log;

// eslint-disable-next-line no-console
const error = console.error;

server.start(err => {
  if (err) {
    throw err;
  }
  log('Server running at', server.info!.uri);
});

server.route({
  method: 'GET',
  path: '/get',
  handler() {
    log('Got a GET');
    throw new Error('an error');
  },
});

server.route({
  method: 'POST',
  path: '/post',
  handler(request) {
    log('Got a POST', request.payload);
    throw new Error('An error on the hapi post route');
  },
});

server.register(
    {register: errorHandler.hapi} as {} as hapi.PluginFunction<{}>, err => {
      if (err) {
        error('There was an error in registering the plugin', err);
      }
    });
