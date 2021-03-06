//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import mongoose from 'mongoose';

const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.ObjectId;

const sessionSchema = new Schema({
  sessionId: { type: String, required: true },
  accountId: { type: ObjectId, required: true },
}, {
  timestamps: true,
});

sessionSchema.statics.findByAccountId = async function(accountId) {
  return SessionModel.findOne({ accountId });
};

sessionSchema.statics.findBySessionId = async function(sessionId) {
  return SessionModel.findOne({ sessionId });
};

if (!sessionSchema.options.toObject) {
  sessionSchema.options.toObject = {};
}
sessionSchema.options.toObject.transform = function (_, ret) {
  return { 'sessionId': ret.sessionId };
};

const SessionModel = mongoose.model('Session', sessionSchema);

export default SessionModel;
