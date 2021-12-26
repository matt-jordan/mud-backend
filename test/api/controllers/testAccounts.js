import assert from 'power-assert';

import AccountModel from '../../../src/db/models/Account.js';

describe('accounts', () => {

  beforeEach(async () => {
    const account = new AccountModel();
    account.email = 'foo@bar.com';
    account.accountName = 'foo';
    account.password = 'test';
    account.characterIds.push('character-1');
    account.characterIds.push('character-2');

    await account.save();
  });

  afterEach(async () => {
    // Just delete everything after every test run
    try {
      await AccountModel.deleteMany();
    } catch (e) {
      console.log(e);
    }
  });

  describe('get', () => {
    it('returns 404 if the account is not known', () => {

    });

    it('returns the account if the account exists', () => {

    });
  });

  describe('create', () => {
    it('returns 409 if the account already exists', () => {

    });

    it('returns a 409 if the accountname is already taken', () => {

    });

    it('returns a 400 if an email address is not provided', () => {

    });

    it('returns a 400 if a password is not provided', () => {

    });

    it('returns a 400 if the password is too short', () => {

    });

    it('returns a 400 if the password is too simple', () => {

    });

    it('returns a 201 if the account is created successfully', () => {

    });
  });

  describe('update', () => {

  });

});