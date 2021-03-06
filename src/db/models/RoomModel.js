//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import mongoose from 'mongoose';

import inanimateRefSchema from './schemas/inanimateRefSchema.js';

const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.ObjectId;

const portalSchema = new Schema({
  direction: { type: String, required: true, enum: ['up', 'down', 'east', 'west', 'north', 'south', 'northeast', 'northwest', 'southeast', 'southwest'], },
  destinationId: { type: ObjectId, required: true },
  doorId: { type: ObjectId },
}, {
  timestamps: true,
});

const roomSchema = new Schema({
  name: { type: String, required: true },
  areaId: { type: ObjectId, required: true },
  description: { type: String, default: '' },
  characterIds: [{ type: ObjectId }],
  inanimates: [{ type: inanimateRefSchema }],
  spawnerIds: [{ type: ObjectId }],
  exits: [{ type: portalSchema }],
}, {
  timestamps: true,
});

const RoomModel = mongoose.model('Room', roomSchema);

export default RoomModel;
