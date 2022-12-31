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
const mongoose_1 = __importDefault(require("mongoose"));
const bcrypt_1 = __importDefault(require("bcrypt"));
;
;
const accountSchema = new mongoose_1.default.Schema({
    accountName: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    characterIds: [{ type: String }],
}, {
    timestamps: true,
    toObject: {
        transform: function (doc, ret) {
            delete ret._id;
            delete ret.password;
            return ret;
        },
    },
});
accountSchema.method('comparePassword', async function (password) {
    const result = await bcrypt_1.default.compare(password, this.password);
    return result;
});
accountSchema.pre('save', function (next) {
    const account = this;
    if (account.isNew || account.isModified('password')) {
        bcrypt_1.default.genSalt(10, (saltError, salt) => {
            if (saltError) {
                return next(saltError);
            }
            bcrypt_1.default.hash(account.password, salt, (hashError, hash) => {
                if (hashError) {
                    return next(hashError);
                }
                account.password = hash;
                next();
            });
        });
    }
    else {
        next();
    }
});
const AccountModel = mongoose_1.default.model('Account', accountSchema);
exports.default = AccountModel;
