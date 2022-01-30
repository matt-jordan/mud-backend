//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const weaponSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  properties: [{ type: String, enum: ['ammunition', 'finesse', 'heavy', 'light', 'loading', 'range', 'reach', 'two-handed', 'versatile']}],
  damageType: { type: String, required: true, enum: [ 'piercing', 'slashing', 'bludgeoning' ]},
  weaponType: { type: String, required: true, enum: [ 'simple', 'martial', 'exotic' ]},
  classRestriction: [{ type: String }],
  levelRestriction: { type: Number, default: 0, },
  weight: { type: Number, default: 1, required: true },
  minDamage: { type: Number, default: 1 },
  maxDamage: { type: Number, default: 1 },
  wearableLocations: [{ type: String, enum: ['leftHand', 'rightHand' ]}],
  durability: {
    current: { type: Number, default: 10 },
    base: { type: Number, default: 10 },
  },
});

const WeaponModel = mongoose.model('Weapon', weaponSchema);

export default WeaponModel;