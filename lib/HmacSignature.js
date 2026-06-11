'use strict';

const { string } = require('naughty-util');
const { createHmac, timingSafeEqual } = require('node:crypto');
const { Buffer } = require('node:buffer');

const ENCODING = 'base64';

class HmacSignature {
  #options = null;

  constructor(options) {
    this.#options = options;
    this.#options.encoding ??= ENCODING;
  }

  #buffer(string) {
    return Buffer.from(string, this.#options.encoding);
  }

  #hmac(payload) {
    return createHmac(this.#options.algo, this.#options.secret)
      .update(this.#buffer(payload))
      .digest();
  }

  sign(payload) {
    return this.#hmac(payload)
      .toString(this.#options.encoding);
  }

  verify(payload, signature) {
    if (!string.valid(signature)) {
      throw new Error('Signature is valid');
    }
    if (!timingSafeEqual(
      this.#hmac(payload),
      this.#buffer(signature),
    )) {
      throw new Error('invalid Signature');
    }
  }

  get algo() {
    return this.#options.algo;
  }

  get encoding() {
    return this.#options.encoding;
  }
}

module.exports = { HmacSignature };
