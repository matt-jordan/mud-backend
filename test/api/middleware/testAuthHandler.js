//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';
import { v4 as uuid } from 'uuid';

import authHandler from '../../../build/api/middleware/authHandler.js';
import AccountModel from '../../../build/db/models/AccountModel.js';
import SessionModel from '../../../build/db/models/SessionModel.js';

describe('authHandler', () => {

  let mockResponse;
  let mockRequest;
  let token;

  beforeEach(async () => {
    const account = new AccountModel();
    account.email = 'foo@bar.com';
    account.accountName = 'foo';
    account.password = 'test';
    await account.save();

    const session = new SessionModel();
    session.accountId = account._id;
    session.sessionId = uuid();
    await session.save();

    token = session.sessionId;

    mockRequest = {
      method: 'GET',
      path: '/validpath',
      headers: {},
    };

    mockResponse = {
      statusCode: 0,
      body: null,
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(body) {
        this.body = body;
        return this;
      },
    };
  });

  afterEach(async () => {
    await AccountModel.deleteMany();
    await SessionModel.deleteMany();
  });

  describe('with a valid auth header', () => {
    describe('when the session is valid', () => {
      it('invokes next with no error', (done) => {
        mockRequest.headers['authorization'] = `Bearer: ${token}`;
        authHandler(mockRequest, mockResponse, (error) => {
          assert(!error);
          done();
        });
      });
    });

    describe('when the session is unknown', () => {
      it('returns a 401', (done) => {
        mockRequest.headers['authorization'] = `Bearer: ${uuid()}`;
        authHandler(mockRequest, mockResponse, (error) => {
          assert(error);
          assert(error.statusCode === 401);
          done();
        });
      });
    });
  });

  describe('when there is something wrong with the auth header', () => {
    describe('too many params', () => {
      it('returns a 403', (done) => {
        mockRequest.headers['authorization'] = 'Bearer: foo bar';
        authHandler(mockRequest, mockResponse, (error) => {
          assert(error);
          assert(error.statusCode === 403);
          done();
        });
      });
    });

    describe('not enough params', () => {
      it('returns a 403', (done) => {
        mockRequest.headers['authorization'] = 'Bearer: ';
        authHandler(mockRequest, mockResponse, (error) => {
          assert(error);
          assert(error.statusCode === 403);
          done();
        });
      });
    });
  });

  describe('when there is no auth header', () => {
    it('returns a 403', (done) => {
      authHandler(mockRequest, mockResponse, (error) => {
        assert(error);
        assert(error.statusCode === 403);
        done();
      });
    });
  });

  describe('ignored routes', () => {
    const ignoredPostRoutes = [
      { method: 'POST', path: '/accounts/foo' },
      { method: 'POST', path: '/login' },
    ];

    ignoredPostRoutes.forEach((routePair) => {
      it(`Ignores ${routePair.path}`, (done) => {
        const req = {
          method: routePair.method,
          path: routePair.path,
        };

        authHandler(req, mockResponse, () => {
          assert(mockResponse.statusCode === 0);
          done();
        });
      });
    });
  });

});