//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import mongoose from 'mongoose';

interface ISessionSchema {
  sessionId: string;
  accountId: mongoose.Types.ObjectId;
};

interface ISessionMethods {
  findByAccountId(accountId: string): Promise<SessionModelType>;
  findBySessionId(sessionId: string): Promise<SessionModelType>;
};

type SessionModelType = mongoose.Model<ISessionSchema, {}, ISessionMethods>;


const sessionSchema = new mongoose.Schema<ISessionSchema, SessionModelType, ISessionMethods>({
  sessionId: { type: String, required: true },
  accountId: { type: mongoose.Schema.Types.ObjectId, required: true },
}, {
  timestamps: true,
  toObject: {
    transform: function(doc: any, ret: any): any {
      return {
        sessionId: ret.sessionId,
      };
    },
  },
});

sessionSchema.static('findByAccountId', async function(accountId: string) {
  return SessionModel.findOne({ accountId });
});

sessionSchema.static('findBySessionId', async function(sessionId: string) {
  return SessionModel.findOne({ sessionId });
});

const SessionModel = mongoose.model<ISessionSchema, SessionModelType, ISessionMethods>('Session', sessionSchema);

export default SessionModel;
