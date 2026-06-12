'use strict';

const { describe, it, before, after } = require("node:test");
const { randomUUID, randomBytes } = require("node:crypto");
const { http: { query, }, logger } = require("naughty-util");
const http = require('./server.js');
const { ISCGateway, ISCSignature } = require('../main');
const { NetworkError } = require('../lib/ApiGateway.js');
const assert = require("node:assert/strict");
const { isArrayBuffer } = require("node:util/types");
const api = require("./api.js");

const json = JSON.stringify;

describe.only('ISCGateway', async () => {
  let stopServer = null;

  await before(async () => {
    const { start, stop } = http({ debug: true, });
    stopServer = stop;
    await start({
      port: 3000,
      api: api()
    });
  });

  await after(async () => {
    await stopServer(1000);
    logger.log('server stopped');
  });

  await it('Basic usage - all method', async () => {
    const signature = new ISCSignature({
      algo: 'sha256',
      secret: randomBytes(32),
      skew: 60,
    });
    const options = { baseurl: 'http://localhost:3000', name: 'Simple', };
    const gateway = new ISCGateway(options, signature);
    const id = randomUUID();
    const path = query('/method', { id, });
    const head = await gateway.head(path);
  });
});