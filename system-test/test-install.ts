// Copyright 2018 Google LLC
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

import {pnpd} from 'pack-n-play';
import {describe, it} from 'mocha';

describe('pack-n-play tests', () => {
  it('imports the module using * syntax', async () => {
    await pnpd({
      code: `import * as errorReporting from '@google-cloud/error-reporting';
new errorReporting.ErrorReporting();`,
    });
  });

  it('imports the module with {} syntax', async () => {
    await pnpd({
      code: `import {ErrorReporting} from '@google-cloud/error-reporting';
new ErrorReporting();`,
    });
  });

  it('imports the module and starts with a partial `serviceContext`', async () => {
    await pnpd({
      code: `import {ErrorReporting} from '@google-cloud/error-reporting';
new ErrorReporting({
  serviceContext: {
    service: 'some service'
  }
});`,
    });
  });

  it('imports the module and starts with a complete `serviceContext`', async () => {
    await pnpd({
      code: `import {ErrorReporting} from '@google-cloud/error-reporting';
new ErrorReporting({
  projectId: 'some-project',
  serviceContext: {
    service: 'Some service',
    version: 'Some version'
  }
});`,
    });
  });

  it('uses express', async () => {
    await pnpd({
      code: `import * as express from 'express';

import {ErrorReporting} from '@google-cloud/error-reporting';
const errors = new ErrorReporting();

const app = express();

app.get('/error', (req, res, next) => {
  res.send('Something broke!');
  next!(new Error('Custom error message'));
});

app.get('/exception', () => {
  JSON.parse('{"malformedJson": true');
});

app.use(errors.express);
`,
      dependencies: {
        express: '4.x.x',
        '@types/express': '4.x.x',
      },
    });
  });

  it('uses hapi16', async () => {
    await pnpd({
      code: `import * as hapi from 'hapi';

import {ErrorReporting} from '@google-cloud/error-reporting';
const errors = new ErrorReporting();

const server = new hapi.Server();
server.connection({ port: 3000 });

server.route({
  method: 'GET',
  path: '/error',
  handler: (request, reply) => {
    reply('Something broke!');
    throw new Error('Custom error message');
  }
});

server.register(errors.hapi);
`,
      dependencies: {
        hapi: '16.x.x',
        '@types/hapi': '16.x.x',
      },
    });
  });

  it('uses hapi17', async () => {
    await pnpd({
      code: `import * as hapi from 'hapi';

import {ErrorReporting} from '@google-cloud/error-reporting';
const errors = new ErrorReporting();

async function start() {
  const server = new hapi.Server({
    host: '0.0.0.0',
    port: 3000
  });

  server.route({
    method: 'GET',
    path: '/error',
    handler: async (request, h) => {
      throw new Error(\`You requested an error at ${new Date()}\`);
    }
  });

  await server.register(errors.hapi);
}

start().catch(console.error);
`,
      dependencies: {
        hapi: '17.x.x',
        '@types/hapi': '17.x.x',
      },
    });
  });

  it('uses koa1', async () => {
    await pnpd({
      code: `import * as Koa from 'koa';

import {ErrorReporting} from '@google-cloud/error-reporting';
const errors = new ErrorReporting();

const app = new Koa();

app.use(errors.koa);

app.use(function *(this: any): IterableIterator<any> {
  //This will set status and message
  this.throw('Error Message', 500);
});

// response
app.use(function *(this: any): IterableIterator<any> {
  this.body = 'Hello World';
});
`,
      dependencies: {
        koa: '1.x.x',
        '@types/koa': '1.x.x',
      },
    });
  });

  it('uses koa2', async () => {
    await pnpd({
      code: `import * as Koa from 'koa';

import {ErrorReporting} from '@google-cloud/error-reporting';
const errors = new ErrorReporting();

const app = new Koa();

app.use(errors.koa2);

app.use(async (ctx: Koa.Context, next: {}) => {
  //This will set status and message
  ctx.throw('Error Message', 500);
});

// response
app.use(async (ctx: Koa.Context, next: {}): Promise<void> => {
  ctx.body = 'Hello World';
});
`,
      dependencies: {
        koa: '2.x.x',
        '@types/koa': '2.x.x',
      },
    });
  });

  it('uses restify', async () => {
    await pnpd({
      code: `import * as restify from 'restify';

import {ErrorReporting} from '@google-cloud/error-reporting';
const errors = new ErrorReporting();

function respond(req: {}, res: {}, next: Function) {
  next(new Error('this is a restify error'));
}

const server = restify.createServer();

server.use(errors.restify(server));
server.get('/hello/:name', respond);
server.head('/hello/:name', respond);
`,
      dependencies: {
        restify: '11.x.x',
        '@types/restify': '^8.5.0',
      },
    });
  });

  it('requires the module using Node 4+ syntax', async () => {
    await pnpd({
      code: `const ErrorReporting = require('@google-cloud/error-reporting').ErrorReporting;
new ErrorReporting();`,
    });
  });

  it('requires the module and starts with a partial `serviceContext`', async () => {
    await pnpd({
      code: `const ErrorReporting = require('@google-cloud/error-reporting').ErrorReporting;
new ErrorReporting({
  serviceContext: {
    service: 'some service'
  }
});`,
    });
  });

  it('requires the module and starts with a complete `serviceContext`', async () => {
    await pnpd({
      code: `const ErrorReporting = require('@google-cloud/error-reporting').ErrorReporting;
new ErrorReporting({
  projectId: 'some-project',
  serviceContext: {
    service: 'Some service',
    version: 'Some version'
  }
});`,
    });
  });

  it('uses express with require', async () => {
    await pnpd({
      code: `const express = require('express');

const ErrorReporting = require('@google-cloud/error-reporting').ErrorReporting;
const errors = new ErrorReporting();

const app = express();

app.get('/error', (req, res, next) => {
  res.send('Something broke!');
  next(new Error('Custom error message'));
});

app.get('/exception', () => {
  JSON.parse('{"malformedJson": true');
});

// Note that express error handling middleware should be attached after all
// the other routes and use() calls. See [express docs][express-error-docs].
app.use(errors.express);
`,
      dependencies: {
        express: '4.x.x',
      },
    });
  });

  it('uses hapi16 with require', async () => {
    await pnpd({
      code: `const hapi = require('hapi');

const ErrorReporting = require('@google-cloud/error-reporting').ErrorReporting;
const errors = new ErrorReporting();

const server = new hapi.Server();
server.connection({ port: 3000 });

server.route({
  method: 'GET',
  path: '/error',
  handler: (request, reply) => {
    reply('Something broke!');
    throw new Error('Custom error message');
  }
});

server.register(errors.hapi);
`,
      dependencies: {
        hapi: '16.x.x',
      },
    });
  });

  it('uses hapi17 with require', async () => {
    await pnpd({
      code: `const hapi = require('hapi');

const ErrorReporting = require('@google-cloud/error-reporting').ErrorReporting;
const errors = new ErrorReporting();

async function start() {
  const server = new hapi.Server({
    host: '0.0.0.0',
    port: 3000
  });

  server.route({
    method: 'GET',
    path: '/error',
    handler: async (request, h) => {
      throw new Error(\`You requested an error at ${new Date()}\`);
    }
  });

  await server.register(errors.hapi);
}

start().catch(console.error);
`,
      dependencies: {
        hapi: '17.x.x',
      },
    });
  });

  it('uses koa1 with require', async () => {
    await pnpd({
      code: `const Koa = require('koa');

const ErrorReporting = require('@google-cloud/error-reporting').ErrorReporting;
const errors = new ErrorReporting();

const app = new Koa();

app.use(errors.koa);

app.use(function *(next) {
  //This will set status and message
  this.throw('Error Message', 500);
});

// response
app.use(function *(){
  this.body = 'Hello World';
});
`,
      dependencies: {
        koa: '1.x.x',
      },
    });
  });

  it('uses koa2 with require', async () => {
    await pnpd({
      code: `const Koa = require('koa');

const ErrorReporting = require('@google-cloud/error-reporting').ErrorReporting;
const errors = new ErrorReporting();

const app = new Koa();

app.use(errors.koa2);

app.use(async (ctx, next) => {
  //This will set status and message
  ctx.throw('Error Message', 500);
});

// response
app.use(async (ctx, next) => {
  ctx.body = 'Hello World';
});
`,
      dependencies: {
        koa: '2.x.x',
      },
    });
  });

  it('uses restify with require', async () => {
    await pnpd({
      code: `const restify = require('restify');

const ErrorReporting = require('@google-cloud/error-reporting').ErrorReporting;
const errors = new ErrorReporting();

function respond(req, res, next) {
  next(new Error('this is a restify error'));
}

const server = restify.createServer();

server.use(errors.restify(server));
server.get('/hello/:name', respond);
server.head('/hello/:name', respond);
`,
      dependencies: {
        restify: '11.x.x',
      },
    });
  });
});
