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

const partyMemberSchema = new Schema({
  characterId: { type: ObjectId },
});

const partySchema = new Schema({
  partyLeaderId: { type: ObjectId },
  partyMembers: [{ type: partyMemberSchema }],
  invitedMemberIds: [{ type: ObjectId }],
  maxPartyMembers: { type: Number, default: 2 },
}, {
  timestamps: true,
});

const PartyModel = mongoose.model('Party', partySchema);

export default PartyModel;
