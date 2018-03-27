/**
 * Copyright 2017 Google Inc. All Rights Reserved.
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

import * as assert from 'assert';

import {ErrorMessage} from '../../src/classes/error-message';
import {populateErrorMessage} from '../../src/populate-error-message';

const TEST_USER_INVALID = 12;
const TEST_MESSAGE = 'This is a test';
const TEST_SERVICE_DEFAULT = {service: 'node', version: undefined};
const TEST_STACK_DEFAULT = {
  filePath: '',
  lineNumber: 0,
  functionName: '',
};

/*
 * The type of each property is {} to allow the tests to set values
 * of various types to test the outcome.
 */
interface AnnotatedError {
  user?: {};
  serviceContext?: {};
  stack?: {};
  filePath?: {};
  lineNumber?: {};
  functionName?: {};
};

describe('populate-error-message', function() {
  let em;
  const adversarialObjectInput = {
    stack: {},
  };
  const adversarialObjectInputTwo = {
    stack: [],
  };
  beforeEach(function() {
    em = new ErrorMessage();
  });

  it('Should not throw given undefined', function() {
    assert.doesNotThrow(populateErrorMessage.bind(null, undefined, em));
  });

  it('Should not throw given null', function() {
    assert.doesNotThrow(populateErrorMessage.bind(null, null, em));
  });

  it('Should not throw given a string', function() {
    assert.doesNotThrow(populateErrorMessage.bind(null, 'string_test', em));
  });

  it('Should not throw given a number', function() {
    assert.doesNotThrow(populateErrorMessage.bind(null, 1.2, em));
  });

  it('Should not throw given an array', function() {
    assert.doesNotThrow(populateErrorMessage.bind(null, [], em));
  });

  it('Should not throw given an object', function() {
    assert.doesNotThrow(populateErrorMessage.bind(null, {}, em));
  });

  it('Should not throw given an instance of Error', function() {
    assert.doesNotThrow(populateErrorMessage.bind(null, new Error(), em));
  });

  it('Should not throw given an object of invalid form', function() {
    assert.doesNotThrow(
        populateErrorMessage.bind(null, adversarialObjectInput, em));
    assert.doesNotThrow(
        populateErrorMessage.bind(null, adversarialObjectInputTwo, em));
  });

  it('Message Field: Should set the message as the stack given an Error',
     function() {
       const err = new Error(TEST_MESSAGE);
       populateErrorMessage(err, em);
       assert.deepEqual(
           em.message, err.stack,
           'Given a valid message the ' +
               'error message should absorb the error stack as the message');
     });

  it('Message Field: Should set the field given valid input given an object',
     function() {
      let err = {};
       const MESSAGE = 'test';
       err = {message: MESSAGE};
       populateErrorMessage(err, em);
       assert.strictEqual(em.message, MESSAGE);
     });

  it('Message Field: Should default the field given lack-of input given ' +
         'an object',
     function() {
       const err = {};
       populateErrorMessage(err, em);
       assert(em.message.startsWith('[object Object]'));
     });

  it('User Field: Should set the field given valid input given an Error',
     function() {
       const err: AnnotatedError = new Error();
       const TEST_USER_VALID = 'TEST_USER';
       err.user = TEST_USER_VALID;
       populateErrorMessage(err, em);
       assert.strictEqual(em.context.user, TEST_USER_VALID);
     });

  it('User Field: Should default the field given invalid input given an Error',
     function() {
       const err: AnnotatedError = new Error();
       err.user = TEST_USER_INVALID;
       populateErrorMessage(err, em);
       assert.strictEqual(em.context.user, '');
     });

  it('User Field: Should set the field given valid input given an object',
     function() {
       const err: AnnotatedError = {};
       const USER = 'test';
       err.user = USER;
       populateErrorMessage(err, em);
       assert.strictEqual(em.context.user, USER);
     });

  it('User Field: Should default the field given lack-of input given an ' +
         'object',
     function() {
       const err = {};
       populateErrorMessage(err, em);
       assert.strictEqual(em.context.user, '');
     });

  it('ServiceContext Field: Should set the field given valid input given ' +
         'an Error',
     function() {
       const err: AnnotatedError = new Error();
       const TEST_SERVICE_VALID = {service: 'test', version: 'test'};
       err.serviceContext = TEST_SERVICE_VALID;
       populateErrorMessage(err, em);
       assert.deepEqual(err.serviceContext, TEST_SERVICE_VALID);
     });

  it('ServiceContext Field: Should default the field given invalid input ' +
         'given an Error',
     function() {
       const err: AnnotatedError = new Error();
       const TEST_SERVICE_INVALID = 12;
       err.serviceContext = TEST_SERVICE_INVALID;
       populateErrorMessage(err, em);
       assert.deepEqual(em.serviceContext, TEST_SERVICE_DEFAULT);
     });

  it('ServiceContext Field: Should default the field if not given input ' +
         'given an Error',
     function() {
       const err = new Error();
       populateErrorMessage(err, em);
       assert.deepEqual(em.serviceContext, TEST_SERVICE_DEFAULT);
     });

  it('ServiceContext Field: Should set the field given valid input given an ' +
         'object',
     function() {
       const err: AnnotatedError = {};
       const TEST_SERVICE_VALID = {service: 'test', version: 'test'};
       err.serviceContext = TEST_SERVICE_VALID;
       populateErrorMessage(err, em);
       assert.deepEqual(em.serviceContext, TEST_SERVICE_VALID);
     });

  it('ServiceContext Field: Should default the field given invalid input ' +
         'given an object',
     function() {
       const err: AnnotatedError = {};
       const TEST_SERVICE_INVALID = 12;
       err.serviceContext = TEST_SERVICE_INVALID;
       populateErrorMessage(err, em);
       assert.deepEqual(em.serviceContext, TEST_SERVICE_DEFAULT);
     });

  it('ServiceContext Field: Should default the field given lack-of input ' +
         'given an object',
     function() {
       const err = {};
       populateErrorMessage(err, em);
       assert.deepEqual(em.serviceContext, TEST_SERVICE_DEFAULT);
     });

  it('Report location Field: Should default the field if given invalid input ' +
         'given an Error',
     function() {
       const TEST_STACK_INVALID_CONTENTS = {
         filePath: null,
         lineNumber: '2',
         functionName: {},
       };
       const err: AnnotatedError = new Error();
       err.stack = TEST_STACK_INVALID_CONTENTS;
       populateErrorMessage(err, em);
       assert.deepEqual(em.context.reportLocation, TEST_STACK_DEFAULT);
     });

  it('Report location Field: Should default field if not given a valid type ' +
         'given an Error',
     function() {
       const err: AnnotatedError = new Error();
       const TEST_STACK_INVALID_TYPE = [];
       err.stack = TEST_STACK_INVALID_TYPE;
       populateErrorMessage(err, em);
       assert.deepEqual(em.context.reportLocation, TEST_STACK_DEFAULT);
     });

  it('FilePath Field: Should set the field given valid input given an object',
     function() {
       const err: AnnotatedError = {};
       const PATH = 'test';
       err.filePath = PATH;
       populateErrorMessage(err, em);
       assert.strictEqual(em.context.reportLocation.filePath, PATH);
     });

  it('FilePath Field: Should default the field given lack-of input given ' +
         'an object',
     function() {
       const err = {};
       populateErrorMessage(err, em);
       assert.strictEqual(em.context.reportLocation.filePath, '');
     });

  it('LineNumber Field: Should set the field given valid input given an object',
     function() {
       const err: AnnotatedError = {};
       const LINE_NUMBER = 10;
       err.lineNumber = LINE_NUMBER;
       populateErrorMessage(err, em);
       assert.strictEqual(em.context.reportLocation.lineNumber, LINE_NUMBER);
     });

  it('LineNumber Field: Should default the field given lack-of input given ' +
         'an object',
     function() {
       const err = {};
       populateErrorMessage(err, em);
       assert.strictEqual(em.context.reportLocation.lineNumber, 0);
     });

  it('FunctionName Field: Should set the field given valid input given ' +
         'an object',
     function() {
       const err: AnnotatedError = {};
       const FUNCTION_NAME = 'test';
       err.functionName = FUNCTION_NAME;
       populateErrorMessage(err, em);
       assert.strictEqual(
           em.context.reportLocation.functionName, FUNCTION_NAME);
     });

  it('FunctionName Field: Should default the field given lack-of input given ' +
         'an object',
     function() {
       const err = {};
       populateErrorMessage(err, em);
       assert.strictEqual(em.context.reportLocation.functionName, '');
     });
});
