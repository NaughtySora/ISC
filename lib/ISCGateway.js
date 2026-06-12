'use strict';

const { ApiGateway } = require('./ApiGateway.js');

class ISCGateway extends ApiGateway {
  #signature = null;

  constructor(options, signature) {
    super(options);
    this.#signature = signature;
  }

  async request(options) {
    const { signature, ts } = this.#signature.sign(
      options.path, options.method, options.body,
    );
    const custom = { ts, signature, };
    if (options.body) custom['content-type'] = 'application/json';
    const headers = Object.assign({}, options.headers, custom);
    return await super.request(Object.assign({}, options, { headers }));
  }
}

module.exports = { ISCGateway };