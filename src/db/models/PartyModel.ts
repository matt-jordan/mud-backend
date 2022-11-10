//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import mongoose from 'mongoose';

interface IPartyMemberSchema {
  characterId: mongoose.Types.ObjectId;
};

const partyMemberSchema = new mongoose.Schema<IPartyMemberSchema>({
  characterId: { type: mongoose.Schema.Types.ObjectId },
});

interface IPartySchema {
  partyLeaderId: mongoose.Types.ObjectId;
  partyMembers: IPartyMemberSchema[];
  invitedMemberIds: mongoose.Types.ObjectId[];
  maxPartyMembers?: Number;
};

const partySchema = new mongoose.Schema<IPartySchema>({
  partyLeaderId: { type: mongoose.Schema.Types.ObjectId },
  partyMembers: [{ type: partyMemberSchema }],
  invitedMemberIds: [{ type: mongoose.Schema.Types.ObjectId }],
  maxPartyMembers: { type: Number, default: 2 },
}, {
  timestamps: true,
});

const PartyModel = mongoose.model<IPartySchema>('Party', partySchema);

export default PartyModel;
