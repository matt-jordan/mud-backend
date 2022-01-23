//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import mongoose from 'mongoose';

const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.ObjectId;

const areaSchema = new Schema({
  name: { type: String, required: true },
  roomIds: [{ type: ObjectId }],
}, {
  timestamps: true,
});

const AreaModel = mongoose.model('Area', areaSchema);

export default AreaModel;
