//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------
import mongoose from 'mongoose';
import inanimateRefSchema from './schemas/inanimateRefSchema.js';
;
;
;
const inanimateSchema = new mongoose.Schema({
    name: { type: String, required: true },
    inanimateId: { type: String },
    description: { type: String },
    isContainer: { type: Boolean, default: false },
    inanimates: [{ type: inanimateRefSchema }],
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
const InanimateModel = mongoose.model('Inanimate', inanimateSchema);
export default InanimateModel;
