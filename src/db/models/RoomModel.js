//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import mongoose from 'mongoose';

import AreaModel from './AreaModel.js';
import loaderSchema from './schemas/loaderSchema.js';
import inanimateRefSchema from './schemas/inanimateRefSchema.js';
import asyncForEach from '../../lib/asyncForEach.js';
import log from '../../lib/log.js';

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
  loadInfo: { type: loaderSchema, default: {} },
}, {
  timestamps: true,
});

/**
 * Find a Room by its external provided loadId
 *
 * @param {String} loadId - The unique ID of the room
 *
 * @returns {RoomModel}
 */
roomSchema.statics.findByLoadId = async function(loadId) {
  return RoomModel.findOne({ 'loadInfo.loadId': loadId });
};

/**
 * Update this object from the externally loaded object
 *
 * Note that this does not save the RoomModel.
 *
 * @param {Object} loadedObject - The externally provided object
 */
roomSchema.methods.updateFromLoad = async function(loadedObject) {
  if (this.loadInfo.version >= loadedObject.version) {
    return;
  }
  if (this.loadInfo.loadId !== loadedObject.loadId) {
    return;
  }

  this.name = loadedObject.name;
  this.description = loadedObject.description;
}

/**
 * Post-process any IDs that were referenced by the externally loaded object
 *
 * In order to prevent ordering issues, loading an external object first loads
 * all the properties that have to exist (see updateFromLoad). It then updates
 * properties in this method that reference other objects.
 *
 * Note that this does not save the RoomModel.
 *
 * @param {Object} loadedObject - The externally provided object
 */
roomSchema.methods.updateFromLoadRefs = async function(loadedObject) {
  if (this.loadInfo.version >= loadedObject.version) {
    return;
  }
  if (this.loadInfo.loadId !== loadedObject.loadId) {
    return;
  }

  if (loadedObject.areaLoadId) {
    const area = await AreaModel.findByLoadId(loadedObject.areaLoadId);
    if (!area) {
      log.error({ roomId: this._id, areaLoadId: loadedObject.areaLoadId }, 'Unable to find area');
      throw new Error(`Unable to find area: ${loadedObject.areaLoadId }`);
    }
    this.areaId = area._id;
  }

  const exits = [];
  await asyncForEach(loadedObject.exits, async (exit) => {
    const destinationRoom = await RoomModel.findByLoadId(exit.loadId);
    if (!destinationRoom) {
      log.error({ roomId: this._id, roomLoadId: exit.loadId }, 'Unable to find room');
      return;
    }
    // TODO: When we add Doors, make sure we do the lookup here
    exits.push({
      direction: exit.direction,
      destinationId: destinationRoom._id,
    });
  });

  if (exits.length !== loadedObject.exits.length) {
    throw new Error(`Unable to load all exits for room ${this._id}`);
  }
  this.exits = [...exits];
}

const RoomModel = mongoose.model('Room', roomSchema);

export default RoomModel;
