//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import mongoose from 'mongoose';

import inanimateRefSchema, { IInanimateRefSchema } from './schemas/inanimateRefSchema.js';
import modifierSchema, { IModifierSchema } from './schemas/modifierSchema.js';

interface IContainerProperties {
  weighReduction?: Number;
  weightCapacity?: Number;
};

interface IDurability {
  current: Number;
  base: Number;
};

interface IArmorSchema {
  name: string;
  description?: string;
  armorClass?: Number;
  dexterityPenalty?: Number;
  wearableLocations: string[];
  isShield?: boolean;
  isContainer?: boolean;
  inanimates: IInanimateRefSchema[];
  containerProperties?: IContainerProperties;
  classRestriction?: string[];
  levelRestriction?: Number;
  weight: Number;
  size?: string;
  durability: IDurability;
  modifiers: IModifierSchema[];
};

const armorSchema = new mongoose.Schema<IArmorSchema>({
  name: { type: String, required: true },
  description: { type: String },
  armorClass: { type: Number, default: 0 },
  dexterityPenalty: { type: Number, default: 0 },
  wearableLocations: [{ type: String, enum: ['head', 'body', 'neck', 'hands', 'legs', 'feet', 'leftFinger', 'rightFinger', 'leftHand', 'rightHand', 'back'] }],
  isShield: { type: Boolean, default: false },
  isContainer: { type: Boolean, default: false },
  inanimates: [{ type: inanimateRefSchema }],
  containerProperties: {
    weightReduction: { type: Number, default: 0 },
    weightCapacity: { type: Number, default: 10 },
  },
  classRestriction: [{ type: String }],
  levelRestriction: { type: Number, default: 0 },
  weight: { type: Number, default: 1, required: true },
  size: { type: String, default: 'medium', enum: ['small', 'medium', 'large']},
  durability: {
    current: { type: Number, default: 10 },
    base: { type: Number, default: 10 },
  },
  modifiers: [{ type: modifierSchema }],
});

const ArmorModel = mongoose.model('Armor', armorSchema);

export default ArmorModel;