'use strict';

const { randomBytes } = require("node:crypto");
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { ISCSignature } = require('../main');

describe('ISCSignature', () => {
  it('sign/verify', () => {
    const signature = new ISCSignature({
      algo: 'sha256',
      secret: randomBytes(32),
      skew: 60,
    });
    const path = '/method?abc=1';
    const method = 'POST';
    const body = { a: 1, b: 2, c: 3 };
    const s = signature.sign(path, 'POST', body);
    signature.verify([path, method, s.ts, body], s.hash);
  });

  //TODO: 
  // expired, 
  // invalid ts, 
  // invalid payload / length, 
  // invalid signature
});