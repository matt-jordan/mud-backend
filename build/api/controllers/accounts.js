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
const AccountModel_js_1 = __importDefault(require("../../db/models/AccountModel.js"));
const errors_js_1 = require("../../lib/errors.js");
const router = (0, express_1.Router)();
router.get('/:accountId', async (req, res, next) => {
    const accountName = req.params.accountId;
    const account = await AccountModel_js_1.default.findOne({ accountName }).exec();
    if (!account) {
        return next(new errors_js_1.NotFoundError(`Account '${accountName}' not found`));
    }
    return res.status(200).json(account.toObject());
});
// Handy regex for testing passwords:
//  - at least 8 characters, but shorter than 32
//  - At least one lower case letter
//  - At least one upper case letter
//  - At least one number
//  - At least one special character
const passwordRegex = /^(?=.*[\d])(?=.*[A-Z])(?=.*[a-z])(?=.*[!@#$%^&*])[\w!@#$%^&*]{8,32}$/;
router.post('/:accountId', async (req, res, next) => {
    const accountName = req.params.accountId;
    const existingAccount = await AccountModel_js_1.default.findOne({ accountName }).exec();
    if (existingAccount) {
        return next(new errors_js_1.ConflictError(`Account '${accountName}' already exists`));
    }
    const { password, email } = req.body;
    if (!password) {
        return next(new errors_js_1.BadRequestError('Accounts must have a password'));
    }
    if (!email) {
        return next(new errors_js_1.BadRequestError('Accounts must have an email'));
    }
    if (!passwordRegex.test(password)) {
        return next(new errors_js_1.BadRequestError('Account password failed complexity check'));
    }
    const account = new AccountModel_js_1.default();
    account.password = password;
    account.email = email;
    account.accountName = accountName;
    await account.save();
    return res.status(201).json(account.toObject());
});
router.put('/:accountId', async (req, res, next) => {
    const accountName = req.params.accountId;
    const account = await AccountModel_js_1.default.findOne({ accountName }).exec();
    if (!account) {
        return next(new errors_js_1.NotFoundError(`Account '${accountName}' not found`));
    }
    const { password, email } = req.body;
    if (password && !passwordRegex.test(password)) {
        return next(new errors_js_1.BadRequestError('Account password failed complexity check'));
    }
    account.password = password || account.password;
    account.email = email || account.email;
    await account.save();
    return res.status(200).json(account.toObject());
});
router.put('/:accountId/characters/:characterId', async (req, res, next) => {
    const accountName = req.params.accountId;
    const characterId = req.params.characterId;
    const account = await AccountModel_js_1.default.findOne({ accountName }).exec();
    if (!account) {
        return next(new errors_js_1.NotFoundError(`Account '${accountName}' not found`));
    }
    if (!account.characterIds.includes(characterId)) {
        account.characterIds.push(characterId);
        await account.save();
    }
    return res.status(200).json(account.toObject());
});
router.delete('/:accountId/characters/:characterId', async (req, res, next) => {
    const accountName = req.params.accountId;
    const characterId = req.params.characterId;
    const account = await AccountModel_js_1.default.findOne({ accountName }).exec();
    if (!account) {
        return next(new errors_js_1.NotFoundError(`Account '${accountName}' not found`));
    }
    account.characterIds = account.characterIds.filter((id) => id !== characterId);
    await account.save();
    return res.status(200).json(account.toObject());
});
exports.default = router;
