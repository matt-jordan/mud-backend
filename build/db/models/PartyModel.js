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
;
const partyMemberSchema = new mongoose_1.default.Schema({
    characterId: { type: mongoose_1.default.Schema.Types.ObjectId },
});
;
const partySchema = new mongoose_1.default.Schema({
    partyLeaderId: { type: mongoose_1.default.Schema.Types.ObjectId },
    partyMembers: [{ type: partyMemberSchema }],
    invitedMemberIds: [{ type: mongoose_1.default.Schema.Types.ObjectId }],
    maxPartyMembers: { type: Number, default: 2 },
}, {
    timestamps: true,
});
const PartyModel = mongoose_1.default.model('Party', partySchema);
exports.default = PartyModel;
