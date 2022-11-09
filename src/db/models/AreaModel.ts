//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import mongoose from 'mongoose';

import loaderSchema, { ILoaderSchema } from './schemas/loaderSchema.js';
import RoomModel from './RoomModel.js';
import asyncForEach from '../../lib/asyncForEach.js';
import log from '../../lib/log.js';

interface IAreaSchema {
  name: string;
  roomIds: mongoose.Types.ObjectId[];
  loadInfo: ILoaderSchema;
};

export interface IAreaLoadModel extends ILoaderSchema {
  name: string;
  roomLoadIds: string[];
};

type updateFromLoadFn = (loadedObject: IAreaLoadModel) => Promise<void>;
type updateFromLoadRefsFn = (loadedObject: IAreaLoadModel) => Promise<void>;
interface IAreaMethodsAndOverrides {
  loadInfo: mongoose.Types.Subdocument & ILoaderSchema;
  updateFromLoad: updateFromLoadFn;
  updateFromLoadRefs: updateFromLoadRefsFn;
};

interface IAreaModel extends mongoose.Model<IAreaSchema, {}, IAreaMethodsAndOverrides> {
  findByLoadId(loadId: string): Promise<any>;
};

const areaSchema = new mongoose.Schema<IAreaSchema, IAreaModel, IAreaMethodsAndOverrides>({
  name: { type: String, required: true },
  roomIds: [{ type: mongoose.Schema.Types.ObjectId }],
  loadInfo: { type: loaderSchema, default: (val: any) => ({ loadId: '', version: 0 }) },
}, {
  timestamps: true,
});

areaSchema.static('findByLoadId', function findByLoadId(loadId: string) {
  return AreaModel.findOne({ 'loadInfo.loadId': loadId });
});

/**
 * Update this object from the externally loaded object
 *
 * Note that this does not save the RoomModel.
 *
 * @param {IAreaLoadModel} loadedObject - The externally provided object
 */
areaSchema.method('updateFromLoad', async function(loadedObject: IAreaLoadModel) {
  if (this.loadInfo.version >= loadedObject.version) {
    return;
  }
  if (this.loadInfo.loadId !== loadedObject.loadId) {
    return;
  }

  this.name = loadedObject.name;
});

/**
 * Post-process any IDs that were referenced by the externally loaded object
 *
 * In order to prevent ordering issues, loading an external object first loads
 * all the properties that have to exist (see updateFromLoad). It then updates
 * properties in this method that reference other objects.
 *
 * Note that this does not save the RoomModel.
 *
 * @param {IAreaLoadModel} loadedObject - The externally provided object
 */
areaSchema.method('updateFromLoadRefs', async function(loadedObject: IAreaLoadModel) {
  if (this.loadInfo.version >= loadedObject.version) {
    return;
  }
  if (this.loadInfo.loadId !== loadedObject.loadId) {
    return;
  }

  const roomIds:mongoose.Types.ObjectId[] = [];
  await asyncForEach(loadedObject.roomLoadIds, async (roomLoadId: string) => {
    const room = await RoomModel.findByLoadId(roomLoadId);
    if (!room) {
      log.error({ areaId: this._id, roomLoadId: roomLoadId }, 'Unable to find room');
      return;
    }

    roomIds.push(room._id);
  });

  if (roomIds.length !== loadedObject.roomLoadIds.length) {
    throw new Error(`Unable to load all rooms for area ${this._id}`);
  }
  this.roomIds = [...roomIds];
});

const AreaModel = mongoose.model<IAreaSchema, IAreaModel, IAreaMethodsAndOverrides>('Area', areaSchema);

export default AreaModel;
