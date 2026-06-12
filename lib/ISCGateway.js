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
    const headers = Object.assign(
      {},
      options.headers,
      { ts, signature, 'content-type': 'application/json' },
    );
    return await super.request(Object.assign({}, options, { headers }));
  }
}

module.exports = { ISCGateway };