//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';
import request from 'supertest';
import { v4 as uuid } from 'uuid';

import AccountModel from '../../../src/db/models/AccountModel.js';
import SessionModel from '../../../src/db/models/SessionModel.js';

describe('accounts', () => {

  let token;

  beforeEach(async () => {
    const account = new AccountModel();
    account.email = 'foo@bar.com';
    account.accountName = 'foo';
    account.password = 'test';
    account.characterIds.push('character-1');
    account.characterIds.push('character-2');
    await account.save();

    const session = new SessionModel();
    session.accountId = account._id;
    session.sessionId = uuid();
    await session.save();

    token = session.sessionId;
  });

  afterEach(async () => {
    await AccountModel.deleteMany();
    await SessionModel.deleteMany();
  });

  describe('get', () => {
    it('returns 404 if the account is not known', (done) => {
      request(server)
        .get('/accounts/doesnotexist')
        .auth(token, { type: 'bearer' })
        .expect('Content-Type', /json/)
        .expect(404, done);
    });

    it('returns the account if the account exists', (done) => {
      request(server)
        .get('/accounts/foo')
        .auth(token, { type: 'bearer' })
        .expect('Content-Type', /json/)
        .expect(200)
        .then((response) => {
          assert(response);
          assert(response.body);
          assert(response.body.email === 'foo@bar.com');
          assert(!response.body.password);
          assert(response.body.accountName === 'foo');
          assert(response.body.characterIds.length === 2);
          done();
        });
    });
  });

  describe('create', () => {
    it('returns 409 if the account already exists', (done) => {
      request(server)
        .post('/accounts/foo')
        .send({
          email: 'foo@bar.com',
          password: 'something',
        })
        .expect('Content-Type', /json/)
        .expect(409, done);
    });

    it('returns a 400 if an email address is not provided', (done) => {
      request(server)
        .post('/accounts/bar')
        .send({
          password: 'something',
        })
        .expect('Content-Type', /json/)
        .expect(400, done);
    });

    it('returns a 400 if a password is not provided', (done) => {
      request(server)
        .post('/accounts/bar')
        .send({
          email: 'foo@bar.com',
        })
        .expect('Content-Type', /json/)
        .expect(400, done);
    });

    it('returns a 400 if the password is too short', (done) => {
      request(server)
        .post('/accounts/bar')
        .send({
          email: 'foo@bar.com',
          password: 'Aa3!',
        })
        .expect('Content-Type', /json/)
        .expect(400, done);
    });

    it('returns a 400 if the password does not contain upper case letters', (done) => {
      request(server)
        .post('/accounts/bar')
        .send({
          email: 'foo@bar.com',
          password: 'aardvark34!',
        })
        .expect('Content-Type', /json/)
        .expect(400, done);
    });

    it('returns a 400 if the password does not contain lower case letters', (done) => {
      request(server)
        .post('/accounts/bar')
        .send({
          email: 'foo@bar.com',
          password: 'AARDVARK34!',
        })
        .expect('Content-Type', /json/)
        .expect(400, done);
    });

    it('returns a 400 if the password does not contain numbers', (done) => {
      request(server)
        .post('/accounts/bar')
        .send({
          email: 'foo@bar.com',
          password: 'AabbCCDDeeFFgg!',
        })
        .expect('Content-Type', /json/)
        .expect(400, done);
    });

    it('returns a 400 if the password does not contain special characters', (done) => {
      request(server)
        .post('/accounts/bar')
        .send({
          email: 'foo@bar.com',
          password: 'Aa3aa4BB3CC8',
        })
        .expect('Content-Type', /json/)
        .expect(400, done);
    });

    it('returns a 400 if the password is too long', (done) => {
      request(server)
        .post('/accounts/bar')
        .send({
          email: 'foo@bar.com',
          password: 'Aa3!Aa3!Aa3!Aa3!Aa3!Aa3!Aa3!Aa3!Aa3!Aa3!Aa3!Aa3!Aa3!Aa3!',
        })
        .expect('Content-Type', /json/)
        .expect(400, done);
    });

    it('returns a 201 if the account is created successfully', (done) => {
      request(server)
        .post('/accounts/bar')
        .send({
          email: 'foo@bar.com',
          password: 'Aardvark34!',
        })
        .expect('Content-Type', /json/)
        .expect(201)
        .then((response) => {
          assert(response);
          assert(response.body);
          assert(response.body.email === 'foo@bar.com');
          assert(!response.body.password);
          assert(response.body.accountName === 'bar');
          assert(response.body.characterIds.length === 0);
          done();
        });
    });
  });

  describe('update', () => {
    it('returns a 404 if the account does not exist', (done) => {
      request(server)
        .put('/accounts/foobar')
        .auth(token, { type: 'bearer' })
        .send({
          email: 'changed@change.com',
          password: 'newpassword12345!',
        })
        .expect('Content-Type', /json/)
        .expect(404, done);
    });

    it('returns a 400 if the password is too short', (done) => {
      request(server)
        .put('/accounts/foo')
        .auth(token, { type: 'bearer' })
        .send({
          password: 'Aa3!',
        })
        .expect('Content-Type', /json/)
        .expect(400, done);
    });

    it('returns a 400 if the password does not contain upper case letters', (done) => {
      request(server)
        .put('/accounts/foo')
        .auth(token, { type: 'bearer' })
        .send({
          password: 'aardvark34!',
        })
        .expect('Content-Type', /json/)
        .expect(400, done);
    });

    it('returns a 400 if the password does not contain lower case letters', (done) => {
      request(server)
        .put('/accounts/foo')
        .auth(token, { type: 'bearer' })
        .send({
          password: 'AARDVARK34!',
        })
        .expect('Content-Type', /json/)
        .expect(400, done);
    });

    it('returns a 400 if the password does not contain numbers', (done) => {
      request(server)
        .put('/accounts/foo')
        .auth(token, { type: 'bearer' })
        .send({
          password: 'AabbCCDDeeFFgg!',
        })
        .expect('Content-Type', /json/)
        .expect(400, done);
    });

    it('returns a 400 if the password does not contain special characters', (done) => {
      request(server)
        .put('/accounts/foo')
        .auth(token, { type: 'bearer' })
        .send({
          password: 'Aa3aa4BB3CC8',
        })
        .expect('Content-Type', /json/)
        .expect(400, done);
    });

    it('returns a 400 if the password is too long', (done) => {
      request(server)
        .put('/accounts/foo')
        .auth(token, { type: 'bearer' })
        .send({
          password: 'Aa3!Aa3!Aa3!Aa3!Aa3!Aa3!Aa3!Aa3!Aa3!Aa3!Aa3!Aa3!Aa3!Aa3!',
        })
        .expect('Content-Type', /json/)
        .expect(400, done);
    });

    it('returns a 200 if the password was updated', (done) => {
      request(server)
        .put('/accounts/foo')
        .auth(token, { type: 'bearer' })
        .send({
          password: 'Newpassword12345!',
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .then((response) => {
          assert(response);
          assert(response.body);
          assert(response.body.email === 'foo@bar.com');
          assert(!response.body.password);
          assert(response.body.accountName === 'foo');
          assert(response.body.characterIds.length === 2);
          done();
        });
    });

    it('returns a 200 if the email was updated', (done) => {
      request(server)
        .put('/accounts/foo')
        .auth(token, { type: 'bearer' })
        .send({
          email: 'changed@change.com',
        })
        .expect('Content-Type', /json/)
        .expect(200)
        .then((response) => {
          assert(response);
          assert(response.body);
          assert(response.body.email === 'changed@change.com');
          assert(!response.body.password);
          assert(response.body.accountName === 'foo');
          assert(response.body.characterIds.length === 2);
          done();
        });
    });

    it('returns a 200 if nothing was provided', (done) => {
      request(server)
        .put('/accounts/foo')
        .auth(token, { type: 'bearer' })
        .expect('Content-Type', /json/)
        .expect(200)
        .then((response) => {
          assert(response);
          assert(response.body);
          assert(response.body.email === 'foo@bar.com');
          assert(!response.body.password);
          assert(response.body.accountName === 'foo');
          assert(response.body.characterIds.length === 2);
          done();
        });
    });
  });

  describe('addCharacter', () => {
    it('returns a 404 if the account does not exist', (done) => {
      request(server)
        .put('/accounts/foobar/characters/character-3')
        .auth(token, { type: 'bearer' })
        .expect('Content-Type', /json/)
        .expect(404, done);
    });

    it('returns a 200 if the account exists and the character does not', (done) => {
      request(server)
        .put('/accounts/foo/characters/character-3')
        .auth(token, { type: 'bearer' })
        .expect('Content-Type', /json/)
        .expect(200)
        .then((response) => {
          assert(response);
          assert(response.body);
          assert(response.body.email === 'foo@bar.com');
          assert(!response.body.password);
          assert(response.body.accountName === 'foo');
          assert(response.body.characterIds.length === 3);
          done();
        });
    });

    it('returns a 200 if the character exists, but does not add it again', (done) => {
      request(server)
        .put('/accounts/foo/characters/character-2')
        .auth(token, { type: 'bearer' })
        .expect('Content-Type', /json/)
        .expect(200)
        .then((response) => {
          assert(response);
          assert(response.body);
          assert(response.body.email === 'foo@bar.com');
          assert(!response.body.password);
          assert(response.body.accountName === 'foo');
          assert(response.body.characterIds.length === 2);
          done();
        });
    });
  });

  describe('removeCharacter', () => {
    it('returns a 404 if the account does not exist', (done) => {
      request(server)
        .delete('/accounts/foobar/characters/character-1')
        .auth(token, { type: 'bearer' })
        .expect('Content-Type', /json/)
        .expect(404, done);
    });

    it('returns a 200 if the character was removed', (done) => {
      request(server)
        .delete('/accounts/foo/characters/character-1')
        .auth(token, { type: 'bearer' })
        .expect('Content-Type', /json/)
        .expect(200)
        .then((response) => {
          assert(response);
          assert(response.body);
          assert(response.body.email === 'foo@bar.com');
          assert(!response.body.password);
          assert(response.body.accountName === 'foo');
          assert(response.body.characterIds.length === 1);
          done();
        });
    });

    it('returns a 200 if the character did not exist', (done) => {
      request(server)
        .delete('/accounts/foo/characters/character-3')
        .auth(token, { type: 'bearer' })
        .expect('Content-Type', /json/)
        .expect(200)
        .then((response) => {
          assert(response);
          assert(response.body);
          assert(response.body.email === 'foo@bar.com');
          assert(!response.body.password);
          assert(response.body.accountName === 'foo');
          assert(response.body.characterIds.length === 2);
          done();
        });
    });
  });
});
