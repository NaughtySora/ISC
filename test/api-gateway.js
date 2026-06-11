'use strict';

const { describe, it, before, after, only } = require("node:test");
const { randomUUID } = require("node:crypto");
const { http: { query, }, reflection,
  logger, async } = require("naughty-util");
const http = require('./server.js');
const { ApiGateway, } = require('../main');
const { NetworkError } = require('../lib/ApiGateway.js');
const assert = require("node:assert/strict");
const { isArrayBuffer } = require("node:util/types");

const json = JSON.stringify;

describe('ApiGateway', async () => {
  let stopServer = null;

  await before(async () => {
    const storage = new Map();
    const { start, stop } = http({ debug: true, });
    stopServer = stop;
    await start({
      port: 3000,
      api: {
        '/method:get': async ({ search }) => {
          const id = search.get('id');
          if (!id) return;
          return storage.get(id);
        },
        '/method:post': async ({ body, search }) => {
          const id = search.get('id');
          if (!id) return;
          storage.set(id, body);
          return body;
        },
        '/method:put': async ({ body, search }) => {
          const id = search.get('id');
          if (!id) return;
          if (!storage.has(id)) return;
          storage.set(id, body);
        },
        '/method:patch': async ({ body, search }) => {
          const id = search.get('id');
          if (!id) return;
          const data = storage.get(id);
          if (!data) return;
          const updated = Object.assign({}, data, body);
          storage.set(id, updated);
          return updated;
        },
        '/method:delete': async ({ search }) => {
          const id = search.get('id');
          if (!id) return;
          storage.delete(id);
        },
        '/method:head': async () => { },
        '/slow:get': async () => {
          await async.pause(3000);
          return { slow: true };
        }
      }
    });
  });

  await after(async () => {
    await stopServer(1000);
    logger.log('server stopped');
  });

  await it('Basic usage - all method', async () => {
    const gateway = new ApiGateway({
      baseurl: 'http://localhost:3000',
      name: 'Simple',
    });
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
    const gateway = new ApiGateway({
      baseurl: 'http://localhost:3000',
      name: 'Global parser',
      parser: async (res) => {
        return await res.arrayBuffer();
      },
    });
    const id = randomUUID();
    const path = query('/method', { id });
    const post = await gateway.post(path, {
      body: json({ id }),
    });
    assert.ok(isArrayBuffer(post));
  });

  await it('parser per request', async () => {
    const gateway = new ApiGateway({
      baseurl: 'http://localhost:3000',
      name: 'Request parser',
    });
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

  await it('timeout | signal', async () => {
    const gateway0 = new ApiGateway({
      baseurl: 'http://localhost:3000',
      name: 'Timeout',
      timeout: 1000,
    });
    await assert
      .rejects(
        async () => gateway0.get('/slow'),
        {
          message: 'The operation was aborted due to timeout'
        }
      );
    const gateway1 = new ApiGateway({
      baseurl: 'http://localhost:3000',
      name: 'Timeout',
    });
    await assert
      .rejects(
        async () => gateway1.get('/slow', { signal: AbortSignal.timeout(500) }),
        {
          message: 'The operation was aborted due to timeout'
        }
      );
  });

  await it('skip body parsing', async () => {
    const gateway = new ApiGateway({
      baseurl: 'http://localhost:3000',
      name: 'Skip body',
    });
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
    const baseurl = 'http://localhost:3000';
    const pathname = '/no-method';
    const gateway = new ApiGateway({ baseurl, name, });
    const path = query(pathname);
    const error = new NetworkError(
      `ApiGateway ${name} request failed`,
      {
        method: 'GET',
        code: 404,
        status: 'Not Found',
        url: `${baseurl}${pathname}`,
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