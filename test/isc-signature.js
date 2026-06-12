'use strict';

const { randomBytes } = require("node:crypto");
const { describe, it, mock } = require("node:test");
const assert = require("node:assert/strict");
const { ISCSignature } = require('../main');

describe.only('ISCSignature', () => {
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

  it.only('expired', (context) => {
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
      assert.equal(e.cause.message, 'Signature is expired')
    }
  });

  //TODO: 
  // invalid ts, 
  // invalid payload / length, 
  // invalid signature
});