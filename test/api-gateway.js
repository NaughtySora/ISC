'use strict';

const { describe, it, before, after } = require("node:test");
const http = require('./server.js');

describe('ApiGateway', async () => {
  let stopServer = null;

  await before(async () => {
    const storage = new Map();
    const { start, stop } = http();
    stopServer = stop;
    await start({
      port: 3000,
      debug: true,
      api: {
        '/method:get': async ({ search }) => {
          const id = search.get(id);
          if (!id) return;
          return storage.get(id);
        },
        '/method:post': async ({ body, search }) => {
          const id = search.get(id);
          if (!id) return;
          storage.set(id, body);
        },
        '/method:put': async ({ body, search }) => {
          const id = search.get(id);
          if (!id) return;
          if (!storage.has(id)) return;
          storage.set(id, body);
        },
        '/method:patch': async ({ body, search }) => {
          const id = search.get(id);
          if (!id) return;
          const data = storage.get(id);
          if (!data) return;
          storage.set(id, Object.assign({}, data, body));
        },
        '/method:delete': async () => {
          const id = search.get(id);
          if (!id) return;
          storage.delete(id);
        },
        '/method:head': async () => { },
      }
    });
  });

  await it('Basic usage - all method', async () => {
    
  });
});