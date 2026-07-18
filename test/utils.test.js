process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.QR_SIGNING_SECRET = 'test-qr-secret';

const test = require('node:test');
const assert = require('node:assert/strict');
const { generateCouponCode } = require('../utils/couponCode');
const { signMemberToken, verify } = require('../utils/qrToken');

test('coupon codes are correctly prefixed and cryptographically varied', () => {
  const first = generateCouponCode();
  const second = generateCouponCode();
  assert.match(first, /^GC-[A-HJ-NP-Z2-9]{8}$/);
  assert.notEqual(first, second);
});

test('member QR tokens verify and reject tampering', () => {
  const token = signMemberToken('GC1234567890');
  assert.deepEqual(verify(token).t, 'member');
  assert.equal(verify(`${token}x`), null);
});
