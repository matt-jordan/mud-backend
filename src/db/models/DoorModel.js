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

const doorSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  isOpen: { type: Boolean, default: false },
  hasLock: { type: Boolean, default: false },
  lockInfo: {
    isLocked: { type: Boolean, default: false },
    skillDC: { type: Number, default: 0 },
    inanimateId: { type: String }, // key
  },
  weight: { type: Number, default: 75 },
  durability: {
    current: { type: Number, default: 25 },
    base: { type: Number, default: 25 },
  },
});

const DoorModel = mongoose.model('Door', doorSchema);

export default DoorModel;