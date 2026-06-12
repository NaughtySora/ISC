'use strict';

const { describe, it, before, after } = require("node:test");
const { randomUUID, randomBytes } = require("node:crypto");
const { http: { query, }, logger, async } = require("naughty-util");
const server = require('../internal/server.js');
const proxy = require('../internal/auth-proxy');
const { ISCGateway, ISCSignature } = require('../main');
const { NetworkError } = require('../lib/ApiGateway.js');
const assert = require("node:assert/strict");
const { isArrayBuffer } = require("node:util/types");
const api = require("../internal/api.js");

const json = JSON.stringify;

const HTTP_PORT = 3000;
const HTTP_HOST = 'http://localhost';
const PROXY_PORT = 1337;

const baseurl = () => `${HTTP_HOST}:${PROXY_PORT}`;

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
    try {
      await stopAuth(1000);
      await stopHttp(1000);
    } catch (e) {
      logger.error(e);
    }
  });

  await it('Basic usage - all method', async () => {
    const options = { baseurl: baseurl(), name: 'Simple', };
    const gateway = new ISCGateway(options, signature);
    const id = randomUUID();
    const path = query('/method', { id, });
    const head = await gateway.head(path);
    const post = await gateway.post(path, {
      body: json({ id, name: 'abc' }),
    });
    const get0 = await gateway.get(path);
    const put = await gateway.put(path, {
      body: json({ id, key: 'value' }),
    });
    const patch = await gateway.patch(path, {
      body: json({ name: 'abc' }),
    });
    const get1 = await gateway.get(path);
    const del = await gateway.delete(path);
    const get2 = await gateway.get(path);
    assert.equal(head, null);
    assert.ok(post !== null);
    assert.ok(get0 !== null);
    assert.equal(put, null);
    assert.ok(patch !== null);
    assert.ok(get1 !== null);
    assert.equal(del, null);
    assert.equal(get2, null);
  });

  await it('global parser', async () => {
    const gateway = new ISCGateway({
      baseurl: baseurl(),
      name: 'Global parser',
      parser: async (res) => {
        return await res.arrayBuffer();
      },
    }, signature);
    const id = randomUUID();
    const path = query('/method', { id });
    const post = await gateway.post(path, {
      body: json({ id }),
    });
    assert.ok(isArrayBuffer(post));
  });

  await it('parser per request', async () => {
    const gateway = new ISCGateway({
      baseurl: baseurl(),
      name: 'Request parser',
    }, signature);
    const id0 = randomUUID();
    const payload0 = { id: id0 };
    const path0 = query('/method', { id: id0 });
    const post0 = await gateway.post(path0, {
      body: json(payload0),
    });
    assert.deepEqual(post0, payload0);

    const id1 = randomUUID();
    const payload1 = { id: id1 };
    const path1 = query('/method', { id: id1 });
    const post1 = await gateway.post(path1, {
      body: json(payload1),
      parser: async (res) => {
        return await res.arrayBuffer();
      },
    });
    assert.ok(isArrayBuffer(post1));
  });

  await it('skip body parsing', async () => {
    const gateway = new ISCGateway({
      baseurl: baseurl(),
      name: 'Skip body',
    }, signature);
    const id = randomUUID();
    const payload = { id };
    const path = query('/method', { id });
    const post = await gateway.post(path, {
      body: json(payload),
      parseBody: false,
    });
    assert.ok(post === null);
  });

  await it('request fail', async () => {
    const name = 'Failed';
    const url = baseurl();
    const pathname = '/no-method';
    const gateway = new ISCGateway({ baseurl: url, name, }, signature);
    const path = query(pathname);
    const error = new NetworkError(
      `ApiGateway ${name} request failed`,
      {
        method: 'GET',
        code: 404,
        status: 'Not Found',
        url: `${url}${pathname}`,
        details: {
          code: 404,
          message: 'Not Found',
        },
      },
    );
    try {
      await gateway.get(path)
    } catch (e) {
      assert.deepEqual(e, error);
    }
  });
});