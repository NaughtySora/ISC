'use strict';

const { async } = require('naughty-util');

module.exports = () => {
  const storage = new Map();
  return {
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
    },
  }
};
