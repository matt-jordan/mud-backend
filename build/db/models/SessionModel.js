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
;
const sessionSchema = new mongoose_1.default.Schema({
    sessionId: { type: String, required: true },
    accountId: { type: mongoose_1.default.Schema.Types.ObjectId, required: true },
}, {
    timestamps: true,
    toObject: {
        transform: function (doc, ret) {
            return {
                sessionId: ret.sessionId,
            };
        },
    },
});
sessionSchema.static('findByAccountId', async function (accountId) {
    return SessionModel.findOne({ accountId });
});
sessionSchema.static('findBySessionId', async function (sessionId) {
    return SessionModel.findOne({ sessionId });
});
const SessionModel = mongoose_1.default.model('Session', sessionSchema);
exports.default = SessionModel;
