'use strict';

const { randomBytes } = require("node:crypto");
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { HmacSignature } = require('../main');

describe('HmacSignature', () => {
  it('sign/verify', () => {
    const signature0 = new HmacSignature({
      secret: randomBytes(32),
      algo: 'sha256',
    });
    const payload0 = { a: 1, b: true, c: 'a' };
    const json0 = JSON.stringify(payload0)
    const s0 = signature0.sign(json0);
    signature0.verify(json0, s0);
    const signature1 = new HmacSignature({
      secret: randomBytes(32),
      algo: 'sha256',
    });
    const s1 = signature1.sign(json0);
    assert.notEqual(s0, s1);
    assert.throws(() => {
      signature1.verify(json0, s0);
    }, { message: "payload and signature are not equal" });
    assert.throws(() => {
      signature1.verify(json0);
    }, { message: "invalid signature" });
    signature1.verify(json0, s1);
  });

  it('getters', () => {
    const signature0 = new HmacSignature({
      secret: randomBytes(32),
      algo: 'sha256',
    });
    assert.equal(signature0.algo, 'sha256');
    assert.equal(signature0.encoding, 'base64');
    const signature1 = new HmacSignature({
      secret: randomBytes(32),
      algo: 'sha256',
      encoding: 'hex'
    });
    assert.equal(signature1.encoding, 'hex');
  });
});