//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import mongoose from 'mongoose';

import loaderSchema from './schemas/loaderSchema.js';
import RoomModel from './RoomModel.js';
import asyncForEach from '../../lib/asyncForEach.js';
import log from '../../lib/log.js';

const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.ObjectId;

const areaSchema = new Schema({
  name: { type: String, required: true },
  roomIds: [{ type: ObjectId }],
  loadInfo: { type: loaderSchema, default: {} },
}, {
  timestamps: true,
});

areaSchema.statics.findByLoadId = async function(loadId) {
  return AreaModel.findOne({ 'loadInfo.loadId': loadId });
};

/**
 * Update this object from the externally loaded object
 *
 * Note that this does not save the RoomModel.
 *
 * @param {Object} loadedObject - The externally provided object
 */
areaSchema.methods.updateFromLoad = async function(loadedObject) {
  if (this.loadInfo.version >= loadedObject.version) {
    return;
  }
  if (this.loadInfo.loadId !== loadedObject.loadId) {
    return;
  }

  this.name = loadedObject.name;
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
areaSchema.methods.updateFromLoadRefs = async function(loadedObject) {
  if (this.loadInfo.version >= loadedObject.version) {
    return;
  }
  if (this.loadInfo.loadId !== loadedObject.loadId) {
    return;
  }

  const rooms = [];
  await asyncForEach(loadedObject.rooms, async (roomLoadId) => {
    const room = await RoomModel.findByLoadId(roomLoadId);
    if (!room) {
      log.error({ areaId: this._id, roomLoadId: roomLoadId }, 'Unable to find room');
      return;
    }

    rooms.push(room._id);
  });

  if (rooms.length !== loadedObject.rooms.length) {
    throw new Error(`Unable to load all rooms for area ${this._id}`);
  }
  this.roomIds = [...rooms];
}

const AreaModel = mongoose.model('Area', areaSchema);

export default AreaModel;
