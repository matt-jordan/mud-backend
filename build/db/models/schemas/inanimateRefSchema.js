//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------
import mongoose from 'mongoose';
;
const inanimateRefSchema = new mongoose.Schema({
    inanimateId: { type: mongoose.Schema.Types.ObjectId, required: true },
    inanimateType: { type: String, required: true, enum: ['weapon', 'armor', 'inanimate'] },
});
export default inanimateRefSchema;
