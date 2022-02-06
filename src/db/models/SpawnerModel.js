//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const spawnerSchema = new Schema({
  characterFactories: [{ type: String }],
  characterSelection: { type: String, default: 'random', enum: [ 'random' ]},
  triggerType: { type: String, default: 'tick', enum: [ 'tick' ]},
  triggerUpperLimit: { type: Number, default: 20 },
  spawnsPerTrigger: { type: Number, default: 1 },
  state: { type: Schema.Types.Mixed },
}, {
  timestamps: true,
});

const SpawnerModel = mongoose.model('Spawner', spawnerSchema);

export default SpawnerModel;