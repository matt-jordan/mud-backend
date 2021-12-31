import assert from 'power-assert';
import mongoose from 'mongoose';

import SessionModel from '../../../src/db/models/Session.js';

describe('SessionModel', () => {

  afterEach(async () => {
    await SessionModel.deleteMany();
  });

  describe('creation', () => {
    it('rejects if there is no account ID', async () => {
      const uut = new SessionModel();
      uut.sessionId = 'foobar';
      assert.rejects(uut.save());
    });

    it('rejects if there is no session ID', async () => {
      const uut = new SessionModel();
      uut.accountId = new mongoose.Types.ObjectId();
      assert.rejects(uut.save());
    });

    it('creates the session with an account ID', async () => {
      const uut = new SessionModel();
      uut.accountId = new mongoose.Types.ObjectId();
      uut.sessionId = 'foobar';
      await uut.save();
      assert(uut);
    });
  });

  describe('toObject', () => {
    it('returns only the session ID', async () => {
      const testObject = new SessionModel();
      testObject.sessionId = 'foobar';
      testObject.accountId = new mongoose.Types.ObjectId();
      await testObject.save();

      const obj = testObject.toObject();
      assert(obj);
      assert(obj.sessionId === 'foobar');
    });
  });

  describe('findByAccountId', () => {
    let accountId;

    beforeEach(async () => {
      accountId = new mongoose.Types.ObjectId();

      const item = new SessionModel();
      item.accountId = accountId;
      item.sessionId = 'foobar';
      await item.save();
    });

    it('returns null when it cannot find the item', async () => {
      const uut = await SessionModel.findByAccountId(new mongoose.Types.ObjectId());
      assert(uut === null);
    });

    it('returns the object when it matches', async () => {
      const uut = await SessionModel.findByAccountId(accountId);
      assert(uut);
      assert(uut.accountId.equals(accountId));
      assert(uut.sessionId === 'foobar');
    });
  });

  describe('findBySessionId', () => {
    let sessionId;

    beforeEach(async () => {
      sessionId = 'foobar';

      const item = new SessionModel();
      item.accountId = new mongoose.Types.ObjectId();
      item.sessionId = sessionId;
      await item.save();
    });

    it('returns null when it cannot find the item', async () => {
      const uut = await SessionModel.findBySessionId('goobar');
      assert(uut === null);
    });

    it('returns the object when it matches', async () => {
      const uut = await SessionModel.findBySessionId(sessionId);
      assert(uut);
      assert(uut.accountId);
      assert(uut.sessionId === sessionId);
    });
  });


});