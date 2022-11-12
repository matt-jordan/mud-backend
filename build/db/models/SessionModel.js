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
;
;
const sessionSchema = new mongoose.Schema({
    sessionId: { type: String, required: true },
    accountId: { type: mongoose.Schema.Types.ObjectId, required: true },
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
sessionSchema.static('findByAccountId', function (accountId) {
    return __awaiter(this, void 0, void 0, function* () {
        return SessionModel.findOne({ accountId });
    });
});
sessionSchema.static('findBySessionId', function (sessionId) {
    return __awaiter(this, void 0, void 0, function* () {
        return SessionModel.findOne({ sessionId });
    });
});
const SessionModel = mongoose.model('Session', sessionSchema);
export default SessionModel;
