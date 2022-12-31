//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';
import request from 'supertest';

import AccountModel from '../../../src/db/models/AccountModel.js';
import SessionModel from '../../../src/db/models/SessionModel.js';

describe('login', () => {

  let account;

  beforeEach(async () => {
    account = new AccountModel();
    account.email = 'foo@bar.com';
    account.accountName = 'foo';
    account.password = 'test';
    await account.save();
  });

  afterEach(async () => {
    await AccountModel.deleteMany();
    await SessionModel.deleteMany();
  });

  describe('post', () => {
    it('returns 400 if the account is not provided', (done) => {
      request(server)
        .post('/login')
        .send({
          password: 'test',
        })
        .expect('Content-Type', /json/)
        .expect(400, done);
    });

    it('returns 400 if the password is not provided', (done) => {
      request(server)
        .post('/login')
        .send({
          accountName: 'foo',
        })
        .expect('Content-Type', /json/)
        .expect(400, done);
    });

    it('returns 401 if the account is not known', (done) => {
      request(server)
        .post('/login')
        .send({
          accountName: 'bar',
          password: 'test',
        })
        .expect('Content-Type', /json/)
        .expect(401, done);
    });

    it('returns 401 if the password is not known', (done) => {
      request(server)
        .post('/login')
        .send({
          accountName: 'foo',
          password: 'notcorrect!',
        })
        .expect('Content-Type', /json/)
        .expect(401, done);
    });

    describe('when successful', () => {
      describe('and there is no session yet', () => {
        it('returns a 201 if the session does not exist yet', (done) => {
          request(server)
            .post('/login')
            .send({
              accountName: 'foo',
              password: 'test',
            })
            .expect('Content-Type', /json/)
            .expect(201)
            .then((response) => {
              assert(response);
              assert(response.body.sessionId);
              assert(response.body.accountName === 'foo');
              done();
            });
        });
      });

      describe('and there is already a session', () => {
        beforeEach(async () => {
          const session = new SessionModel();
          session.accountId = account._id;
          session.sessionId = 'testsession';
          await session.save();
        });

        it('returns a 201 if the session exists', (done) => {
          request(server)
            .post('/login')
            .send({
              accountName: 'foo',
              password: 'test',
            })
            .expect('Content-Type', /json/)
            .expect(201)
            .then((response) => {
              assert(response);
              assert(response.body.sessionId === 'testsession');
              assert(response.body.accountName === 'foo');
              done();
            });
        });
      });
    });
  });
});