//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import mongoose from 'mongoose';
import loaderSchema from './schemas/loaderSchema.js';

const Schema = mongoose.Schema;

const spawnerSchema = new Schema({
  characterFactories: [{ type: String }],
  characterSelection: { type: String, default: 'random', enum: [ 'random' ]},
  triggerType: { type: String, default: 'tick', enum: [ 'tick' ]},
  triggerUpperLimit: { type: Number, default: 20 },
  spawnsPerTrigger: { type: Number, default: 1 },
  state: { type: Schema.Types.Mixed },
  factoryData: { type: Schema.Types.Mixed },
  loadInfo: { type: loaderSchema, default: {} },
}, {
  timestamps: true,
});

/**
 * Find a Spawner by its external provided loadId
 *
 * @param {String} loadId - The unique ID of the spawner
 *
 * @returns {SpawnerModel}
 */
spawnerSchema.statics.findByLoadId = async function(loadId) {
  return SpawnerModel.findOne({ 'loadInfo.loadId': loadId });
};

/**
 * Update this object from the externally loaded object
 *
 * Note that this does not save the SpawnerModel.
 *
 * @param {Object} loadedObject - The externally provided object
 */
spawnerSchema.methods.updateFromLoad = async function(loadedObject) {
  if (this.loadInfo.version >= loadedObject.version) {
    return;
  }
  if (this.loadInfo.loadId !== loadedObject.loadId) {
    return;
  }

  if (loadedObject.characterFactories) {
    this.characterFactories = [...loadedObject.characterFactories];
  }
  if (loadedObject.characterSelection) {
    this.characterSelection = loadedObject.characterSelection;
  }
  if (loadedObject.triggerType) {
    this.triggerType = loadedObject.triggerType;
  }
  if (loadedObject.triggerUpperLimit) {
    this.triggerUpperLimit = loadedObject.triggerUpperLimit;
  }
  if (loadedObject.spawnsPerTrigger) {
    this.spawnsPerTrigger = loadedObject.spawnsPerTrigger;
  }
  if (loadedObject.factoryData) {
    this.factoryData = loadedObject.factoryData;
  }
};

/**
 * Post-process any IDs that were referenced by the externally loaded object
 *
 * In order to prevent ordering issues, loading an external object first loads
 * all the properties that have to exist (see updateFromLoad). It then updates
 * properties in this method that reference other objects.
 *
 * Note that this does not save the SpawnerModel.
 *
 * @param {Object} loadedObject - The externally provided object
 */
spawnerSchema.methods.updateFromLoadRefs = async function(loadedObject) {
  if (this.loadInfo.version >= loadedObject.version) {
    return;
  }
  if (this.loadInfo.loadId !== loadedObject.loadId) {
    return;
  }
  return;
};

const SpawnerModel = mongoose.model('Spawner', spawnerSchema);

export default SpawnerModel;