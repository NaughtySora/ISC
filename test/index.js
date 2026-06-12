'use strict';

const { resolve } = require('node:path');
const { globSync } = require('node:fs');

const files = globSync('*.js', {
  cwd: __dirname,
  exclude: ['index.js', 'server.js', 'api.js', 'auth-proxy.js'],
});

for (const file of files) require(resolve(__dirname, file));