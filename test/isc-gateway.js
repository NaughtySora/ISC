'use strict';

const { describe, it, before, after } = require("node:test");
const { randomUUID, randomBytes } = require("node:crypto");
const { http: { query, }, logger, async } = require("naughty-util");
const server = require('./server.js');
const proxy = require('./auth-proxy.js');
const { ISCGateway, ISCSignature } = require('../main');
const { NetworkError } = require('../lib/ApiGateway.js');
const assert = require("node:assert/strict");
const { isArrayBuffer } = require("node:util/types");
const api = require("./api.js");

const json = JSON.stringify;

const HTTP_PORT = 3000;
const HTTP_HOST = 'http://localhost';
const PROXY_PORT = 1337;

const baseurl = () => `${HTTP_HOST}:${HTTP_PORT}`;
const proxyUrl = () => `${HTTP_HOST}:${PROXY_PORT}`;

describe('ISCGateway', async () => {
  let stopHttp = null;
  let stopAuth = null;
  const signature = new ISCSignature({
    algo: 'sha256',
    secret: randomBytes(32),
    skew: 60,
  });
  await before(async () => {
    const http = server({ debug: true, });
    const auth = proxy({ port: PROXY_PORT, signature });
    stopHttp = http.stop;
    stopAuth = auth.stop;
    await http.start({ port: HTTP_PORT, api: api(), });
    await auth.start({ port: HTTP_PORT, host: 'localhost', });
  });

  await after(async () => {
    await stopAuth(1000);
    await stopHttp(1000);
  });

  await it('Basic usage - all method', async () => {
    const options = { baseurl: proxyUrl(), name: 'Simple', };
    const gateway = new ISCGateway(options, signature);
    const id = randomUUID();
    const path = query('/method', { id, });
    const post = await gateway.post(path, { body: JSON.stringify({ b: 1 }) });
    const get = await gateway.get(path);
  });
});