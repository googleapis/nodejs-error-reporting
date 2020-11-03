// Copyright 2017 Google LLC
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

import * as assert from 'assert';
import {describe, it} from 'mocha';
import * as path from 'path';
import {buildStackTrace} from '../../src/build-stack-trace';

const SRC_ROOT = path.join(__dirname, '..', '..', 'src');

describe('build-stack-trace', () => {
  it('Should not have a message attached if none is given', () => {
    assert(buildStackTrace().includes('    at'));
    assert(!buildStackTrace(undefined).startsWith('undefined'));
    assert(!buildStackTrace(null).startsWith('null'));
  });

  it('Should attach a message if given', () => {
    assert(buildStackTrace('Some Message').startsWith('Some Message\n'));
  });

  it('Should not contain error-reporting specific frames', () => {
    (function functionA() {
      (function functionB() {
        (function functionC() {
          const stackTrace = buildStackTrace();
          assert(stackTrace);
          assert.strictEqual(stackTrace.indexOf(SRC_ROOT), -1);
        })();
      })();
    })();
  });

  it('Should return the stack trace', () => {
    (function functionA() {
      (function functionB() {
        (function functionC() {
          const stackTrace = buildStackTrace();
          assert(stackTrace);
          assert.notStrictEqual(stackTrace.indexOf('functionA'), -1);
          assert.notStrictEqual(stackTrace.indexOf('functionB'), -1);
          assert.notStrictEqual(stackTrace.indexOf('functionC'), -1);
        })();
      })();
    })();
  });
});
