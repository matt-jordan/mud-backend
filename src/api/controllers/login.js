//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import { Router } from 'express';
import { v4 as uuid } from 'uuid';

import { BadRequestError, UnauthorizedError } from '../../lib/errors.js';
import AccountModel from '../../db/models/AccountModel.js';
import SessionModel from '../../db/models/SessionModel.js';

const router = Router();

router.post('/', async (req, res, next) => {
  const { accountName, password } = req.body;
  if (!accountName) {
    return next(new BadRequestError('You must login with an accountName'));
  }
  if (!password) {
    return next(new BadRequestError('You must login with a password'));
  }

  const account = await AccountModel.findOne({ accountName }).exec();
  if (!account) {
    return next(new UnauthorizedError());
  }

  const result = await account.comparePassword(password);
  if (!result) {
    return next(new UnauthorizedError());
  }

  // If we already have a session, return the session
  let session = await SessionModel.findByAccountId(account._id);
  if (!session) {
    session = new SessionModel();
    session.accountId = account._id;
    session.sessionId = uuid();
    await session.save();
  }

  return res.status(201).json({
    ...session.toObject(),
    accountName: account.accountName,
  });
});

export default router;