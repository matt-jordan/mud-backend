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
import AccountModel from '../../db/models/AccountModel.js';
import { BadRequestError, NotFoundError, ConflictError } from '../../lib/errors.js';
const router = Router();
router.get('/:accountId', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const accountName = req.params.accountId;
    const account = yield AccountModel.findOne({ accountName }).exec();
    if (!account) {
        return next(new NotFoundError(`Account '${accountName}' not found`));
    }
    return res.status(200).json(account.toObject());
}));
// Handy regex for testing passwords:
//  - at least 8 characters, but shorter than 32
//  - At least one lower case letter
//  - At least one upper case letter
//  - At least one number
//  - At least one special character
const passwordRegex = /^(?=.*[\d])(?=.*[A-Z])(?=.*[a-z])(?=.*[!@#$%^&*])[\w!@#$%^&*]{8,32}$/;
router.post('/:accountId', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const accountName = req.params.accountId;
    const existingAccount = yield AccountModel.findOne({ accountName }).exec();
    if (existingAccount) {
        return next(new ConflictError(`Account '${accountName}' already exists`));
    }
    const { password, email } = req.body;
    if (!password) {
        return next(new BadRequestError('Accounts must have a password'));
    }
    if (!email) {
        return next(new BadRequestError('Accounts must have an email'));
    }
    if (!passwordRegex.test(password)) {
        return next(new BadRequestError('Account password failed complexity check'));
    }
    const account = new AccountModel();
    account.password = password;
    account.email = email;
    account.accountName = accountName;
    yield account.save();
    return res.status(201).json(account.toObject());
}));
router.put('/:accountId', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const accountName = req.params.accountId;
    const account = yield AccountModel.findOne({ accountName }).exec();
    if (!account) {
        return next(new NotFoundError(`Account '${accountName}' not found`));
    }
    const { password, email } = req.body;
    if (password && !passwordRegex.test(password)) {
        return next(new BadRequestError('Account password failed complexity check'));
    }
    account.password = password || account.password;
    account.email = email || account.email;
    yield account.save();
    return res.status(200).json(account.toObject());
}));
router.put('/:accountId/characters/:characterId', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const accountName = req.params.accountId;
    const characterId = req.params.characterId;
    const account = yield AccountModel.findOne({ accountName }).exec();
    if (!account) {
        return next(new NotFoundError(`Account '${accountName}' not found`));
    }
    if (!account.characterIds.includes(characterId)) {
        account.characterIds.push(characterId);
        yield account.save();
    }
    return res.status(200).json(account.toObject());
}));
router.delete('/:accountId/characters/:characterId', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const accountName = req.params.accountId;
    const characterId = req.params.characterId;
    const account = yield AccountModel.findOne({ accountName }).exec();
    if (!account) {
        return next(new NotFoundError(`Account '${accountName}' not found`));
    }
    account.characterIds = account.characterIds.filter((id) => id !== characterId);
    yield account.save();
    return res.status(200).json(account.toObject());
}));
export default router;
