//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { BadRequestError, UnauthorizedError } from '../../lib/errors.js';
import AccountModel from '../../db/models/AccountModel.js';
import SessionModel from '../../db/models/SessionModel.js';
const router = Router();
router.post('/', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { accountName, password } = req.body;
    if (!accountName) {
        return next(new BadRequestError('You must login with an accountName'));
    }
    if (!password) {
        return next(new BadRequestError('You must login with a password'));
    }
    const account = yield AccountModel.findOne({ accountName }).exec();
    if (!account) {
        return next(new UnauthorizedError());
    }
    const result = yield account.comparePassword(password);
    if (!result) {
        return next(new UnauthorizedError());
    }
    // If we already have a session, return the session
    let session = yield SessionModel.findByAccountId(account._id);
    if (!session) {
        session = new SessionModel();
        session.accountId = account._id;
        session.sessionId = uuid();
        yield session.save();
    }
    return res.status(201).json(Object.assign(Object.assign({}, session.toObject()), { accountName: account.accountName }));
}));
export default router;
