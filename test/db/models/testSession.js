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
      assert.rejects(uut.save());
    });

    it('creates the session with an account ID', async () => {
      const uut = new SessionModel();
      uut.accountId = new mongoose.Types.ObjectId();
      await uut.save();
      assert(uut);
    });
  });

  describe('findByAccountId', () => {
    let accountId;

    beforeEach(async () => {
      accountId = new mongoose.Types.ObjectId();

      const item = new SessionModel();
      item.accountId = accountId;
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
    });
  });

});