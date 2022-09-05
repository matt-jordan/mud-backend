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
  loadInfo: { type: loaderSchema, default: {} },
});

/**
 * Find a Door by its external provided loadId
 *
 * @param {String} loadId - The unique ID of the door
 *
 * @returns {DoorModel}
 */
doorSchema.statics.findByLoadId = async function(loadId) {
  return DoorModel.findOne({ 'loadInfo.loadId': loadId });
};

/**
 * Update this object from the externally loaded object
 *
 * Note that this does not save the RoomModel.
 *
 * @param {Object} loadedObject - The externally provided object
 */
doorSchema.methods.updateFromLoad = async function(loadedObject) {
  if (this.loadInfo.version >= loadedObject.version) {
    return;
  }
  if (this.loadInfo.loadId !== loadedObject.loadId) {
    return;
  }

  this.name = loadedObject.name;
  this.description = loadedObject.description;
  this.hasLock = loadedObject.hasLock ?? false;
  this.lockInfo.skillDC = loadedObject.skillDC ?? 0;
  if (loadedObject.inanimateId) {
    this.lockInfo.inanimateId = loadedObject.inanimateId;
  }
  this.weight = loadedObject.weight ?? 75;
  this.durability.base = loadedObject.durability ?? 25;
  this.durability.current = this.durability.base;
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
doorSchema.methods.updateFromLoadRefs = async function(loadedObject) {
  if (this.loadInfo.version >= loadedObject.version) {
    return;
  }
  if (this.loadInfo.loadId !== loadedObject.loadId) {
    return;
  }
};

const DoorModel = mongoose.model('Door', doorSchema);

export default DoorModel;