//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import AccountModel from '../../../src/db/models/AccountModel.js';

describe('AccountModel', () => {

  afterEach(async () => {
    await AccountModel.deleteMany();
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

  describe('toObject', () => {
    it('strips the password out', async () => {
      const uut = new AccountModel();
      uut.accountName = 'foo';
      uut.email = 'foo@bar.com';
      uut.password = 'test';
      await uut.save();

      const obj = uut.toObject();
      assert(obj);
      assert(!obj.password);
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
