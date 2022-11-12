//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------
import mongoose from 'mongoose';
;
const partyMemberSchema = new mongoose.Schema({
    characterId: { type: mongoose.Schema.Types.ObjectId },
});
;
const partySchema = new mongoose.Schema({
    partyLeaderId: { type: mongoose.Schema.Types.ObjectId },
    partyMembers: [{ type: partyMemberSchema }],
    invitedMemberIds: [{ type: mongoose.Schema.Types.ObjectId }],
    maxPartyMembers: { type: Number, default: 2 },
}, {
    timestamps: true,
});
const PartyModel = mongoose.model('Party', partySchema);
export default PartyModel;
