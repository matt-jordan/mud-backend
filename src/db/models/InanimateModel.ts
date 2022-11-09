//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import mongoose from 'mongoose';

import inanimateRefSchema, { IInanimateRefSchema } from './schemas/inanimateRefSchema.js';

interface IContainerProperties {
  weighReduction?: Number;
  weightCapacity?: Number;
};

interface ICurrencyProperties {
  name?: string;
  quantity?: Number;
}

interface IDurability {
  current: Number;
  base: Number;
};

interface IInanimateSchema {
  name: string;
  inanimateId?: string;
  description?: string;
  isContainer?: Boolean;
  inanimates: IInanimateRefSchema[];
  containerProperties?: IContainerProperties;
  isCurrency?: Boolean;
  currencyProperties?: ICurrencyProperties;
  destructionTime?: Number;
  weight: Number;
  durability: IDurability;
};

const inanimateSchema = new mongoose.Schema<IInanimateSchema>({
  name: { type: String, required: true },
  inanimateId: { type: String }, // A friendly ID for references that should transcend lifetimes
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