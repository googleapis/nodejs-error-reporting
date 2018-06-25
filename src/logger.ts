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

import is from 'is';
import has from 'lodash.has';

const packageJson = require('../../package.json');

import {ConfigurationOptions} from './configuration';
import {Logger} from '@google-cloud/common';

/**
 * Creates an instance of the Google Cloud Diagnostics logger class. This
 * instance will be configured to log at the level given by the environment or
 * the runtime configuration property `logLevel`. If neither of these inputs are
 * given or valid then the logger will default to logging at log level `WARN`.
 * Order of precedence for logging level is:
 * 1) Environmental variable `GCLOUD_ERRORS_LOGLEVEL`
 * 2) Runtime configuration property `logLevel`
 * 3) Default log level of `WARN` (2)
 * @function createLogger
 * @param {ConfigurationOptions} initConfiguration - the desired project/error
 *  reporting configuration. Will look for the  `logLevel` property which, if
 *  supplied, must be a number or stringified decimal representation of a
 *  number between and including 1 through 5
 * @returns {Object} - returns an instance of the logger created with the given/
 *  default options
 */
export function createLogger(initConfiguration?: ConfigurationOptions) {
  // Default to log level: warn (2)
  const DEFAULT_LEVEL = Logger.LEVELS[2];
  let level = DEFAULT_LEVEL;
  if (has(process.env, 'GCLOUD_ERRORS_LOGLEVEL')) {
    // Cast env string as integer
    level =
        Logger.LEVELS[~~process.env.GCLOUD_ERRORS_LOGLEVEL!] || DEFAULT_LEVEL;
  } else if (
      is.object(initConfiguration) && has(initConfiguration, 'logLevel')) {
    if (is.string(initConfiguration!.logLevel)) {
      // Cast string as integer
      level = Logger.LEVELS[~~initConfiguration!.logLevel!] || DEFAULT_LEVEL;
    } else if (is.number(initConfiguration!.logLevel)) {
      level =
          Logger.LEVELS[Number(initConfiguration!.logLevel!)] || DEFAULT_LEVEL;
    } else {
      throw new Error(
          'config.logLevel must be a number or decimal ' +
          'representation of a number in string form');
    }
  }
  return new Logger({level, tag: packageJson.name});
}
