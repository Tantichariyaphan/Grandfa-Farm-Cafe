// utils/couponCode.js
// Generates short, unique, human-readable-ish coupon codes.
// Format: GC-XXXXXXXX (base32-ish, no ambiguous chars like 0/O/1/I)

const crypto = require('crypto');

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0,O,1,I

function generateCouponCode(prefix = 'GC') {
  const bytes = crypto.randomBytes(8);
  let code = '';
  for (let i = 0; i < bytes.length; i += 1) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return `${prefix}-${code}`;
}

module.exports = { generateCouponCode };