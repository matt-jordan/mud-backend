"use strict";
//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const uuid_1 = require("uuid");
const errors_js_1 = require("../../lib/errors.js");
const AccountModel_js_1 = __importDefault(require("../../db/models/AccountModel.js"));
const SessionModel_js_1 = __importDefault(require("../../db/models/SessionModel.js"));
const router = (0, express_1.Router)();
router.post('/', async (req, res, next) => {
    const { accountName, password } = req.body;
    if (!accountName) {
        return next(new errors_js_1.BadRequestError('You must login with an accountName'));
    }
    if (!password) {
        return next(new errors_js_1.BadRequestError('You must login with a password'));
    }
    const account = await AccountModel_js_1.default.findOne({ accountName }).exec();
    if (!account) {
        return next(new errors_js_1.UnauthorizedError());
    }
    const result = await account.comparePassword(password);
    if (!result) {
        return next(new errors_js_1.UnauthorizedError());
    }
    // If we already have a session, return the session
    let session = await SessionModel_js_1.default.findByAccountId(account._id);
    if (!session) {
        session = new SessionModel_js_1.default();
        session.accountId = account._id;
        session.sessionId = (0, uuid_1.v4)();
        await session.save();
    }
    return res.status(201).json({
        ...session.toObject(),
        accountName: account.accountName,
    });
});
exports.default = router;
