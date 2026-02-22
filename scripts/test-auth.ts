#!/usr/bin/env tsx

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
const userId = process.argv[2] || 'test-user-123';

// Generate test JWT
const token = jwt.sign(
  {
    sub: userId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
  },
  JWT_SECRET
);

console.log('Generated JWT token:');
console.log(token);
console.log('\nDecoded:');
console.log(jwt.decode(token));

// Verify token
try {
  const verified = jwt.verify(token, JWT_SECRET);
  console.log('\n✅ Token verified successfully');
  console.log(verified);
} catch (error) {
  console.error('\n❌ Token verification failed:', error);
}
