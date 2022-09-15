//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const modifierSchema = new Schema({
  modifierType: { type: String, required: true, enum: [
    'attribute',
    'characterAttribute',
    'damageBonus',
  ] },
  value: { type: Schema.Types.Mixed },
  modifier: { type: Number },
});

export default modifierSchema;