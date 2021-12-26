import assert from 'power-assert';

import AccountModel from '../../../src/db/models/Account.js';

describe('AccountModel', () => {

  afterEach(async () => {
    // Just delete everything after every test run
    try {
      await AccountModel.deleteMany();
    } catch (e) {
      console.log(e);
    }
  });

  describe('creating', () => {
    it('rejects if there is no accountName', async () => {
      const uut = new AccountModel();
      uut.password = 'foo';
      uut.email = 'foo@bar.com';

      assert.rejects(uut.save());
    });

    it('rejects if there is no email', () => {
      const uut = new AccountModel();
      uut.accountName = 'foo';
      uut.password = 'bar';

      assert.rejects(uut.save());
    });

    it('rejects if there is no password', () => {
      const uut = new AccountModel();
      uut.accountName = 'foo';
      uut.email = 'foo@bar.com';

      assert.rejects(uut.save());
    });

    it('hashes the password after saving', async () => {
      const uut = new AccountModel();
      uut.accountName = 'foo';
      uut.email = 'foo@bar.com';
      uut.password = 'test';

      await uut.save();
      assert(uut.password !== 'test');
    });
  });

  describe('comparePassword', () => {
    let uut;

    beforeEach(async () => {
      uut = new AccountModel();
      uut.accountName = 'foo';
      uut.email = 'foo@bar.com';
      uut.password = 'test';

      await uut.save();
    });

    it('returns false when the passwords do not match', async () => {
      const result = await uut.comparePassword('foobar');
      assert(!result);
    });

    it('returns true when the passwords match', async () => {
      const result = await uut.comparePassword('test');
      assert(result);
    });
  });

});
