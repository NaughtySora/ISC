'use strict';

const {
  date: { SECOND },
  error: { DomainError },
  http: { CODES },
  array,
} = require('naughty-util');
const { HmacSignature } = require('./HmacSignature.js');

const { forbidden, } = CODES;

const unix = () => Math.floor(Date.now() / SECOND);

class ISCSignature {
  #signature = null;
  #skew;

  constructor(options) {
    this.#signature = new HmacSignature({
      algo: options.algo,
      secret: options.secret,
      encoding: options.encoding,
    });
    this.#skew = options.skew;
  }

  #expired(ts) {
    const diff = Math.abs(unix() - ts);
    if (
      !Number.isFinite(diff) ||
      this.#skew < diff
    ) {
      throw new Error('signature is expired');
    }
  }

  #parseTimestamp(ts) {
    if (!ts) throw new TypeError('invalid timestamp');
    const parsed = parseInt(ts, 10);
    if (!Number.isFinite(parsed)) {
      throw new TypeError('invalid timestamp');
    }
    return parsed;
  }

  sign(path, method, body) {
    const ts = unix().toString();
    const payload = [path, method, ts];
    if (body !== undefined) payload.push(body);
    const signature = this.#signature
      .sign(JSON.stringify(payload));
    return { signature, ts };
  }

  verify(payload, signature) {
    try {
      if (!array.valid(payload, 3)) {
        throw new Error('invalid payload length');
      }
      this.#expired(this.#parseTimestamp(payload[2]));
      this.#signature.verify(JSON.stringify(payload), signature);
    } catch (cause) {
      throw new DomainError(
        CODES[forbidden],
        { code: forbidden, cause },
      );
    }
  }
}

module.exports = { ISCSignature };
