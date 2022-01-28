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

// TODO: This is now shared between Room, Armor, and Character. Pull it out.
const inanimateSchema = new Schema({
  inanimateId: { type: ObjectId, required: true },
  inanimateType: { type: String, required: true, enum: ['weapon', 'armor'] },
});

const armorSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  armorClass: { type: Number, default: 0 },
  dexterityPenalty: { type: Number, default: 0 },
  wearableLocations: [{ type: String, enum: ['head', 'body', 'neck', 'hands', 'legs', 'feet', 'leftFinger', 'rightFinger', 'leftHand', 'rightHand', 'back'] }],
  isShield: { type: Boolean, default: false },
  isContainer: { type: Boolean, default: false },
  inanimates: [{ type: inanimateSchema }],
  containerProperties: {
    weightReduction: { type: Number, default: 0 },
    weightCapacity: { type: Number, default: 10 },
  },
  classRestriction: [{ type: String }],
  levelRestriction: { type: Number, default: 0 },
  weight: { type: Number, default: 1, required: true },
  durability: {
    current: { type: Number, default: 10 },
    base: { type: Number, default: 10 },
  },
});

const ArmorModel = mongoose.model('Armor', armorSchema);

export default ArmorModel;