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
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
;
;
const accountSchema = new mongoose.Schema({
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
accountSchema.method('comparePassword', function (password) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield bcrypt.compare(password, this.password);
        return result;
    });
});
accountSchema.pre('save', function (next) {
    const account = this;
    if (account.isNew || account.isModified('password')) {
        bcrypt.genSalt(10, (saltError, salt) => {
            if (saltError) {
                return next(saltError);
            }
            bcrypt.hash(account.password, salt, (hashError, hash) => {
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
const AccountModel = mongoose.model('Account', accountSchema);
export default AccountModel;
