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

import * as assert from 'assert';
import * as hapi from 'hapi';

import {hapiRequestInformationExtractor} from '../../../src/request-extractors/hapi';
import {Fuzzer} from '../../../utils/fuzzer';

describe('hapiRequestInformationExtractor behaviour', () => {
  describe('behaviour given invalid input', () => {
    it('Should produce the default value', () => {
      const DEFAULT_RETURN_VALUE = {
        method: '',
        url: '',
        userAgent: '',
        referrer: '',
        statusCode: 0,
        remoteAddress: '',
      };
      const f = new Fuzzer();
      const cbFn = (value: {}) => {
        assert.deepEqual(value, DEFAULT_RETURN_VALUE);
      };
      f.fuzzFunctionForTypes(hapiRequestInformationExtractor, ['object'], cbFn);
    });
  });
  describe('behaviour given valid input', () => {
    const FULL_REQ_DERIVATION_VALUE = {
      method: 'STUB_METHOD',
      url: 'www.TEST-URL.com',
      info: {
        remoteAddress: '0.0.0.0',
      },
      headers: {
        'x-forwarded-for': '0.0.0.1',
        'user-agent': 'Something like Mozilla',
        referrer: 'www.ANOTHER-TEST.com',
      },
      response: {
        statusCode: 200,
      },
    };
    const FULL_REQ_EXPECTED_VALUE = {
      method: 'STUB_METHOD',
      url: 'www.TEST-URL.com',
      userAgent: 'Something like Mozilla',
      referrer: 'www.ANOTHER-TEST.com',
      remoteAddress: '0.0.0.1',
      statusCode: 200,
    };
    const PARTIAL_REQ_DERIVATION_VALUE = {
      method: 'STUB_METHOD_#2',
      url: 'www.SUPER-TEST.com',
      info: {
        remoteAddress: '0.0.2.1',
      },
      headers: {
        'user-agent': 'Something like Gecko',
        referrer: 'www.SUPER-ANOTHER-TEST.com',
      },
      response: {
        output: {
          statusCode: 201,
        },
      },
    };
    const PARTIAL_REQ_EXPECTED_VALUE = {
      method: 'STUB_METHOD_#2',
      url: 'www.SUPER-TEST.com',
      userAgent: 'Something like Gecko',
      referrer: 'www.SUPER-ANOTHER-TEST.com',
      remoteAddress: '0.0.2.1',
      statusCode: 201,
    };
    const ANOTHER_PARTIAL_REQ_DERIVATION_VALUE = {
      method: 'STUB_METHOD_#2',
      url: 'www.SUPER-TEST.com',
      headers: {
        'user-agent': 'Something like Gecko',
        referrer: 'www.SUPER-ANOTHER-TEST.com',
      },
    };
    const ANOTHER_PARTIAL_REQ_EXPECTED_VALUE = {
      method: 'STUB_METHOD_#2',
      url: 'www.SUPER-TEST.com',
      userAgent: 'Something like Gecko',
      referrer: 'www.SUPER-ANOTHER-TEST.com',
      remoteAddress: '',
      statusCode: 0,
    };
    it('Should produce the full request input', () => {
      assert.deepEqual(
          hapiRequestInformationExtractor(
              FULL_REQ_DERIVATION_VALUE as {} as hapi.Request),
          FULL_REQ_EXPECTED_VALUE);
    });
    it('Should produce the partial request input', () => {
      assert.deepEqual(
          hapiRequestInformationExtractor(
              PARTIAL_REQ_DERIVATION_VALUE as {} as hapi.Request),
          PARTIAL_REQ_EXPECTED_VALUE);
    });
    it('Should produce the second partial request input', () => {
      assert.deepEqual(
          hapiRequestInformationExtractor(
              ANOTHER_PARTIAL_REQ_DERIVATION_VALUE as {} as hapi.Request),
          ANOTHER_PARTIAL_REQ_EXPECTED_VALUE);
    });
  });
});
