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
const inanimateRefSchema_js_1 = __importDefault(require("./schemas/inanimateRefSchema.js"));
;
;
;
const inanimateSchema = new mongoose_1.default.Schema({
    name: { type: String, required: true },
    inanimateId: { type: String },
    description: { type: String },
    isContainer: { type: Boolean, default: false },
    inanimates: [{ type: inanimateRefSchema_js_1.default }],
    containerProperties: {
        weightReduction: { type: Number, default: 0 },
        weightCapacity: { type: Number, default: 10 },
    },
    isCurrency: { type: Boolean, default: false },
    currencyProperties: {
        name: { type: String },
        quantity: { type: Number },
    },
    destructionTime: { type: Number, default: -1 },
    weight: { type: Number, default: 1, required: true },
    durability: {
        current: { type: Number, default: 10 },
        base: { type: Number, default: 10 },
    },
});
const InanimateModel = mongoose_1.default.model('Inanimate', inanimateSchema);
exports.default = InanimateModel;
