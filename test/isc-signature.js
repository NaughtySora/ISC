'use strict';

const { randomBytes } = require("node:crypto");
const { describe, it, mock } = require("node:test");
const assert = require("node:assert/strict");
const { ISCSignature } = require('../main');

describe('ISCSignature', () => {
  it('sign/verify with body', () => {
    const signature = new ISCSignature({
      algo: 'sha256',
      secret: randomBytes(32),
      skew: 60,
    });
    const path = '/method?abc=1';
    const method = 'POST';
    const body = { a: 1, b: 2, c: 3 };
    const s = signature.sign(path, method, body);
    signature.verify([path, method, s.ts, body], s.signature);
  });

  it('sign/verify with no body', () => {
    const signature = new ISCSignature({
      algo: 'sha256',
      secret: randomBytes(32),
      skew: 60,
    });
    const path = '/method?abc=1';
    const method = 'GET';
    const s = signature.sign(path, method);
    signature.verify([path, method, s.ts], s.signature);
  });

  it('expired', (context) => {
    const signature = new ISCSignature({
      algo: 'sha256',
      secret: randomBytes(32),
      skew: 60,
    });
    const path = '/method?abc=1';
    const method = 'GET';
    const s = signature.sign(path, method);
    signature.verify([path, method, s.ts], s.signature);
    const now = new Date(Date.now() - 70000);
    context.mock.timers.enable({ apis: ['Date'], now });
    try {
      signature.verify([path, method, s.ts], s.signature);
    } catch (e) {
      assert.match(e.cause.message, /signature is expired/);
    }
  });

  it('invalid ts', () => {
    const signature = new ISCSignature({
      algo: 'sha256',
      secret: randomBytes(32),
      skew: 60,
    });
    const path = '/method?abc=1';
    const method = 'GET';
    const s = signature.sign(path, method);
    signature.verify([path, method, s.ts], s.signature);
    try {
      signature.verify([path, method, 'test'], s.signature);
    } catch (e) {
      assert.match(e.cause.message, /invalid timestamp/);
    }
    try {
      signature.verify([path, method], s.signature);
    } catch (e) {
      assert.match(e.cause.message, /invalid payload length/);
    }
  });

  it('invalid payload', () => {
    const signature = new ISCSignature({
      algo: 'sha256',
      secret: randomBytes(32),
      skew: 60,
    });
    const path = '/method?abc=1';
    const method = 'GET';
    const s = signature.sign(path, method);
    signature.verify([path, method, s.ts], s.signature);
    try {
      signature.verify({ path, method, ts: s.ts }, s.signature);
    } catch (e) {
      assert.match(e.cause.message, /invalid payload length/);
    }
  });

  it('invalid payload', () => {
    const signature = new ISCSignature({
      algo: 'sha256',
      secret: randomBytes(32),
      skew: 60,
    });
    const path = '/method?abc=1';
    const method = 'GET';
    const s = signature.sign(path, method);
    signature.verify([path, method, s.ts], s.signature);
    try {
      signature.verify([path, method, s.ts], 1234);
    } catch (e) {
      assert.match(e.cause.message, /invalid signature/);
    }
    try {
      signature.verify([path, method, s.ts], Buffer.from('12346'));
    } catch (e) {
      assert.match(e.cause.message, /invalid signature/);
    }
  });

});