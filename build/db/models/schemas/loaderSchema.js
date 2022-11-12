//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------
import mongoose from 'mongoose';
;
const loaderSchema = new mongoose.Schema({
    loadId: { type: String },
    version: { type: Number, default: 0, },
});
export default loaderSchema;
