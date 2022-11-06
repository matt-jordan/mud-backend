//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

interface IAccount {
  accountName: string;
  email: string;
  password: string;
  characterIds: string[];
};

interface IAccountMethods {
  comparePassword(password: string): boolean;
};

type AccountModel = mongoose.Model<IAccount, {}, IAccountMethods>;

const accountSchema = new mongoose.Schema<IAccount, AccountModel, IAccountMethods>({
  accountName: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  characterIds: [{ type: String }],
}, {
  timestamps: true,
  toObject: {
    transform: function(doc: any, ret: any): any {
      delete ret._id;
      delete ret.password;
      return ret;
    },
  },
});

accountSchema.method('comparePassword', async function (password) {
  const result = await bcrypt.compare(password, this.password);
  return result;
});

accountSchema.pre('save', function(next) {
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
  } else {
    next();
  }
});

const AccountModel = mongoose.model<IAccount>('Account', accountSchema);

export default AccountModel;
