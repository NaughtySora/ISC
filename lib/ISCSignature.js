'use strict';

const {
  date: { unix },
  error: { DomainError },
  http: { CODES },
} = require('naughty-util');
const { HmacSignature } = require('./HmacSignature.js');

const { forbidden, } = CODES;

class ISCSignature {
  #signature = null;

  constructor(options, skew) {
    this.#signature = new HmacSignature(options);
    this.#skew = skew;
  }

  #expired(ts) {
    const diff = unix() - ts;
    if (
      !Number.isFinite(diff) ||
      diff < 0 ||
      diff > this.#skew
    ) {
      throw new Error('Signature is expired');
    }
  }

  #parseTimestamp(payload) {
    if (!payload.ts) throw new TypeError('Invalid timestamp');
    const ts = parseInt(payload.ts, 10);
    if (!Number.isFinite(ts)) {
      throw new TypeError('Invalid timestamp');
    }
  }

  sign(payload) {
    const ts = unix().toString();
    const hash = this.#signature.sign(JSON.stringify({
      path: payload.path,
      method: payload.body,
      ts,
      body: payload.body,
    }));
    return [hash, ts];
  }

  verify(payload, signature) {
    try {
      this.#expired(this.#parseTimestamp(payload));
      this.#signature.verify(payload, signature);
    } catch (cause) {
      throw new DomainError(
        CODES[forbidden],
        { code: forbidden, cause },
      );
    }
  }
}

module.exports = { ISCSignature };
