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

const factionSchema = new Schema({
  name: { type: String, required: true },
  opposingFactions: [{ type: String }],
  supportingFactions: [{ type: String }],
  positiveModifier: { type: Number, default: 1 },
  negativeModifier: { type: Number, default: 1 },
  startingValue: { type: Number, default: 50 },
  loadInfo: { type: loaderSchema, default: {} },
});

/**
 * Find a Faction by its external provided loadId
 *
 * @param {String} loadId - The unique ID of the door
 *
 * @returns {FactionModel}
 */
factionSchema.statics.findByLoadId = async function(loadId) {
  return FactionModel.findOne({ 'loadInfo.loadId': loadId });
};

/**
 * Update this object from the externally loaded object
 *
 * Note that this does not save the FactionModel.
 *
 * @param {Object} loadedObject - The externally provided object
 */
factionSchema.methods.updateFromLoad = async function(loadedObject) {
  if (this.loadInfo.version >= loadedObject.version) {
    return;
  }
  if (this.loadInfo.loadId !== loadedObject.loadId) {
    return;
  }

  this.name = loadedObject.name;
  this.supportingFactions = [ ...(loadedObject.supportingFactions ?? []) ];
  this.opposingFactions = [ ...(loadedObject.opposingFactions ?? []) ];
  this.positiveModifier = loadedObject.positiveModifier ?? 1;
  this.negativeModifier = loadedObject.negativeModifier ?? 1;
  this.startingValue = loadedObject.startingValue ?? 50;
};

/**
 * Post-process any IDs that were referenced by the externally loaded object
 *
 * In order to prevent ordering issues, loading an external object first loads
 * all the properties that have to exist (see updateFromLoad). It then updates
 * properties in this method that reference other objects.
 *
 * @param {Object} loadedObject - The externally provided object
 */
factionSchema.methods.updateFromLoadRefs = async function(loadedObject) {
  if (this.loadInfo.version >= loadedObject.version) {
    return;
  }
  if (this.loadInfo.loadId !== loadedObject.loadId) {
    return;
  }
};

const FactionModel = mongoose.model('Faction', factionSchema);

export default FactionModel;