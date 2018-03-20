/**
 * Copyright 2018 Google Inc. All Rights Reserved.
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
import {SpawnOptions} from 'child_process';
import * as path from 'path';

import {globP, mkdirP, ncpP, rimrafP, spawnP, tmpDirP, writeFileP} from './utils';

const INDEX_TS = 'index.ts';
const INDEX_JS = 'index.js';

const TS_CODE_ARRAY: CodeSample[] = [
  {
    code: `import * as errorReporting from '@google-cloud/error-reporting';
new errorReporting.ErrorReporting();`,
    description: 'imports the module using * syntax',
    dependencies: [],
    devDependencies: [],
    skip: true
  },
  {
    code: `import {ErrorReporting} from '@google-cloud/error-reporting';
new ErrorReporting();`,
    description: 'imports the module with {} syntax',
    dependencies: [],
    devDependencies: [],
    skip: true
  },
  {
    code: `import {ErrorReporting} from '@google-cloud/error-reporting';
new ErrorReporting({
  serviceContext: {
    service: 'some service'
  }
});`,
    description:
        'imports the module and starts with a partial `serviceContext`',
    dependencies: [],
    devDependencies: [],
    skip: true
  },
  {
    code: `import {ErrorReporting} from '@google-cloud/error-reporting';
new ErrorReporting({
  projectId: 'some-project',
  serviceContext: {
    service: 'Some service',
    version: 'Some version'
  }
});`,
    description:
        'imports the module and starts with a complete `serviceContext`',
    dependencies: [],
    devDependencies: [],
    skip: true
  },
  {
    code: `import * as express from 'express';

import {ErrorReporting} from '@google-cloud/error-reporting';
const errors = new ErrorReporting();

const app = express();

app.get('/error', (req, res, next) => {
  res.send('Something broke!');
  next(new Error('Custom error message'));
});

app.get('/exception', () => {
  JSON.parse('{\"malformedJson\": true');
});

app.use(errors.express);
`,
    description: 'can be used with express',
    dependencies: ['express'],
    devDependencies: ['@types/express'],
    skip: false
  }
];

const JS_CODE_ARRAY: CodeSample[] = [
  {
    code:
        `const ErrorReporting = require('@google-cloud/error-reporting').ErrorReporting;
new ErrorReporting();`,
    description: 'requires the module using Node 4+ syntax',
    dependencies: [],
    devDependencies: [],
    skip: true
  },
  {
    code:
        `const ErrorReporting = require('@google-cloud/error-reporting').ErrorReporting;
new ErrorReporting({
  serviceContext: {
    service: 'some service'
  }
});`,
    description:
        'requires the module and starts with a partial `serviceContext`',
    dependencies: [],
    devDependencies: [],
    skip: true
  },
  {
    code:
        `const ErrorReporting = require('@google-cloud/error-reporting').ErrorReporting;
new ErrorReporting({
  projectId: 'some-project',
  serviceContext: {
    service: 'Some service',
    version: 'Some version'
  }
});`,
    description:
        'requires the module and starts with a complete `serviceContext`',
    dependencies: [],
    devDependencies: [],
    skip: true
  },
  {
    code: `const express = require('express');

const ErrorReporting = require('@google-cloud/error-reporting').ErrorReporting;
const errors = ErrorReporting();

const app = express();

app.get('/error', (req, res, next) => {
  res.send('Something broke!');
  next(new Error('Custom error message'));
});

app.get('/exception', () => {
  JSON.parse('{\"malformedJson\": true');
});

// Note that express error handling middleware should be attached after all
// the other routes and use() calls. See [express docs][express-error-docs].
app.use(errors.express);
`,
    description: 'can be used with express',
    dependencies: ['express'],
    devDependencies: [],
    skip: false
  }
];

const TIMEOUT_MS = 2 * 60 * 1000;

interface CodeSample {
  code: string;
  description: string;
  dependencies: string[];
  devDependencies: string[];
  skip?: boolean;
}

describe('Installation', () => {
  let text = '';
  let installDir: string|undefined;

  function log(txt: string): void {
    text += txt;
  }

  async function run(
      cmd: string, args: string[], options?: SpawnOptions): Promise<void> {
    await spawnP(cmd, args, options, log);
  }

  before(async () => {
    const tgz = await globP(`${process.cwd()}/*.tgz`);
    assert.deepStrictEqual(
        tgz.length, 0,
        `Expected zero tgz files in the current working directory before ` +
            `running the test but found files: ${tgz.map(file => {
              const parts = file.split(path.sep);
              return parts[parts.length - 1];
            })}`);
  });

  beforeEach(async function() {
    this.timeout(TIMEOUT_MS);
    text = '';
    // This script assumes that you don't already have a TGZ file
    // in your current working directory.
    installDir = await tmpDirP();
    log(`Using installation directory: ${installDir}`);
    await run('npm', ['install']);
    await run('npm', ['run', 'compile']);
    await run('npm', ['pack']);
    const tgz = await globP(`${process.cwd()}/*.tgz`);
    if (tgz.length !== 1) {
      throw new Error(
          `Expected 1 tgz file in current directory, but found ${tgz.length}`);
    }
    await run('npm', ['init', '-y'], {cwd: installDir});
    await run(
        'npm', ['install', 'typescript', '@types/node', tgz[0]],
        {cwd: installDir});
  });

  afterEach(async function() {
    this.timeout(TIMEOUT_MS);
    if (installDir) {
      await rimrafP(installDir);
    }
    if (this.currentTest.state === 'failed') {
      console.log(text);
    }
  });

  describe('When used with Typescript code', () => {
    TS_CODE_ARRAY.forEach((sample) => {
      const fn = sample.skip ? it.skip : it;
      fn(`should install and work with code that ${sample.description}`,
         async function() {
           this.timeout(TIMEOUT_MS);
           assert(installDir);
           const srcDir = path.join(installDir!, 'src');
           await mkdirP(srcDir);

           await writeFileP(path.join(srcDir, INDEX_TS), sample.code, 'utf-8');

           if (sample.dependencies.length > 0) {
             await run(
                 'npm', ['install', '--save'].concat(sample.dependencies),
                 {cwd: installDir});
           }

           const devDeps =
               sample.devDependencies.concat(['gts', 'typescript@2.x']);
           await run(
               'npm', ['install', '--save-dev'].concat(devDeps),
               {cwd: installDir});

           await run('gts', ['init', '--yes'], {cwd: installDir});
           await run('npm', ['run', 'compile'], {cwd: installDir});
           const buildDir = path.join(installDir!, 'build');
           await run(
               'node', [path.join(buildDir, 'src', INDEX_JS)],
               {cwd: installDir});
         });
    });
  });

  describe('When used with Javascript code', () => {
    JS_CODE_ARRAY.forEach((sample) => {
      const fn = sample.skip ? it.skip : it;
      fn(`should install and work with code that ${sample.description}`,
         async function() {
           this.timeout(TIMEOUT_MS);
           assert(installDir);

           await writeFileP(
            path.join(installDir!, INDEX_JS), sample.code, 'utf-8');

           if (sample.dependencies) {
             await run(
               'npm', ['install', '--save'].concat(sample.dependencies), {cwd: installDir});
           }

           if (sample.devDependencies) {
             await run(
               'npm', ['install', '--save-dev'].concat(sample.devDependencies),
               {cwd: installDir});
           }

           await run('node', [INDEX_JS], {cwd: installDir});
         });
    });
  });
});
