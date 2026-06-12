'use strict';

const { string } = require('naughty-util');
const { createHmac, timingSafeEqual } = require('node:crypto');
const { Buffer } = require('node:buffer');

const SIGNATURE_ENCODING = 'base64';
const PAYLOAD_ENCODING = "utf-8";


class HmacSignature {
  #options = null;

  constructor(options) {
    this.#options = options;
    this.#options.encoding ??= SIGNATURE_ENCODING;
  }


  #hmac(payload) {
    return createHmac(this.#options.algo, this.#options.secret)
      .update(payload, PAYLOAD_ENCODING)
      .digest();
  }

  sign(payload) {
    if (!string.valid(payload)) {
      throw new Error('payload should be a valid string');
    }
    return this.#hmac(payload)
      .toString(this.#options.encoding);
  }

  verify(payload, signature) {
    if (!string.valid(signature)) {
      throw new Error('invalid signature');
    }
    if (!string.valid(payload)) {
      throw new Error('payload should be a valid string');
    }
    if (!timingSafeEqual(
      this.#hmac(payload),
      Buffer.from(signature, this.#options.encoding),
    )) {
      throw new Error('payload and signature are not equal');
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
