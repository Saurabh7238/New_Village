import assert from 'node:assert/strict';
import test from 'node:test';
import mongoose from 'mongoose';

test('a failed connection is cleared so a later request can retry', async () => {
  const originalConnect = mongoose.connect;
  const originalUri = process.env.MONGODB_URI;
  const originalCache = globalThis.mongoose;
  let attempts = 0;

  process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/db-connect-retry-test';
  globalThis.mongoose = { conn: null, promise: null };
  mongoose.connect = async () => {
    attempts += 1;
    if (attempts === 1) throw new Error('Temporary connection failure');
    return mongoose;
  };

  try {
    const { default: dbConnect } = await import('../lib/dbConnect.js?retry-test');

    await assert.rejects(dbConnect(), /Temporary connection failure/);
    assert.equal(globalThis.mongoose.promise, null);
    assert.equal(globalThis.mongoose.conn, null);
    assert.equal(await dbConnect(), mongoose);
    assert.equal(attempts, 2);
  } finally {
    mongoose.connect = originalConnect;
    globalThis.mongoose = originalCache;
    if (originalUri === undefined) {
      delete process.env.MONGODB_URI;
    } else {
      process.env.MONGODB_URI = originalUri;
    }
  }
});
