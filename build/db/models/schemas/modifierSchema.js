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
const modifierSchema = new mongoose_1.default.Schema({
    modifierType: { type: String, required: true, enum: [
            'attribute',
            'characterAttribute',
            'damageBonus',
        ] },
    value: { type: mongoose_1.default.Schema.Types.Mixed },
    modifier: { type: Number },
});
exports.default = modifierSchema;
