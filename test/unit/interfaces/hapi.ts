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

import has = require('lodash.has');
import * as is from 'is';
const isFunction = (is as {} as {fn: Function}).fn;
const isObject = is.object;
import * as assert from 'assert';
import {makeHapiPlugin as hapiInterface} from '../../../src/interfaces/hapi';
import {ErrorMessage} from '../../../src/classes/error-message';
import {Fuzzer} from '../../../utils/fuzzer';
import {EventEmitter} from 'events';
import * as config from '../../../src/configuration';
import { RequestHandler } from '../../../src/google-apis/auth-client';
import {FakeConfiguration as Configuration} from '../../fixtures/configuration';

describe('Hapi interface', function() {
  describe('Fuzzing the setup handler', function() {
    it('Should not throw when fuzzed with invalid types', function() {
      const f = new Fuzzer();
      assert.doesNotThrow(function() {
        f.fuzzFunctionForTypes(hapiInterface, ['object', 'object']);
        return;
      });
    });
  });
  describe('Providing valid input to the setup handler', function() {
    const givenConfig = {
      getVersion: function() {
        return '1';
      },
    };
    let plugin;
    beforeEach(function() {
      plugin = hapiInterface(null!, givenConfig as {} as config.Configuration);
    });
    it('should have plain object as plugin', function() {
      assert(isObject(plugin));
    });
    it('plugin should have a register function property', function() {
      assert(has(plugin, 'register') && isFunction(plugin.register));
    });
    it('the plugin\'s register property should have an attributes property',
       function() {
         assert(
             has(plugin.register, 'attributes') &&
             isObject(plugin.register.attributes));
       });
    it('the plugin\'s attribute property should have a name property',
       function() {
         assert(has(plugin.register.attributes, 'name'));
         assert.strictEqual(
             plugin.register.attributes.name, '@google-cloud/error-reporting');
       });
    it('the plugin\'s attribute property should have a version property',
       function() {
         assert(has(plugin.register.attributes, 'version'));
       });
  });
  describe('hapiRegisterFunction behaviour', function() {
    let fakeServer;
    beforeEach(function() {
      fakeServer = new EventEmitter();
    });
    it('Should call fn when the request-error event is emitted', function() {
      const fakeClient = {
        sendError: function(errMsg) {
          assert(
              errMsg instanceof ErrorMessage,
              'should be an instance of Error message');
        },
      } as {} as RequestHandler;
      const plugin = hapiInterface(fakeClient, {
        lacksCredentials: function() {
          return false;
        },
        getVersion: function() {
          return '1';
        },
        getServiceContext: function() {
          return {service: 'node'};
        },
      } as {} as config.Configuration);
      plugin.register(fakeServer, null!, null!);
      fakeServer.emit('request-error');
    });
  });
  describe('Behaviour around the request/response lifecycle', function() {
    const EVENT = 'onPreResponse';
    const fakeClient = {sendError: function() {}} as {} as RequestHandler;
    let fakeServer, config, plugin;
    before(function() {
      config = new Configuration({
        projectId: 'xyz',
        serviceContext: {
          service: 'x',
          version: '1.x',
        },
      });
      config.lacksCredentials = function() {
        return false;
      };
      plugin = hapiInterface(fakeClient, config);
    });
    beforeEach(function() {
      fakeServer = new EventEmitter();
      fakeServer.ext = fakeServer.on;
    });
    afterEach(function() {
      fakeServer.removeAllListeners();
    });
    it('Should call continue when a boom is emitted if reply is an object',
       function(done) {
         plugin.register(fakeServer, null, function() {});
         fakeServer.emit(EVENT, {response: {isBoom: true}}, {
           continue: function() {
             // The continue function should be called
             done();
           },
         });
       });
    it('Should call continue when a boom is emitted if reply is a function',
       function(done) {
         // Manually testing has shown that in actual usage the `reply` object
         // provided to listeners of the `onPreResponse` event can be a function
         // that has a `continue` property that is a function.
         // If `reply.continue()` is not invoked in this situation, the Hapi
         // app will become unresponsive.
         plugin.register(fakeServer, null, function() {});
         const reply: Function & {continue?: Function} = function() {};
         reply.continue = function() {
           // The continue function should be called
           done();
         };
         fakeServer.emit(EVENT, {response: {isBoom: true}}, reply);
       });
    it('Should call sendError when a boom is received', function(done) {
      const fakeClient = {
        sendError: function(err) {
          assert(err instanceof ErrorMessage);
          done();
        },
      } as {} as RequestHandler;
      const plugin = hapiInterface(fakeClient, config);
      plugin.register(fakeServer, null!, function() {});
      fakeServer.emit('onPreResponse', {response: {isBoom: true}});
    });
    it('Should call next when completing a request', function(done) {
      plugin.register(fakeServer, null, function() {
        // The next function should be called
        done();
      });
      fakeServer.emit(
          EVENT, {response: {isBoom: true}}, {continue: function() {}});
    });
  });
});
