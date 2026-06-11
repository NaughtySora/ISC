'use strict';

const { describe, it, before, after } = require("node:test");
const { randomUUID } = require("node:crypto");
const { http: { query, }, reflection, logger } = require("naughty-util");
const http = require('./server.js');
const { ApiGateway } = require('../main');
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
      name: 'Parser',
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
});