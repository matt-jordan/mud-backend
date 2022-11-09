//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import mongoose from 'mongoose';

import AreaModel from './AreaModel.js';
import DoorModel from './DoorModel.js';
import SpawnerModel, { ISpawnerLoadModel } from './SpawnerModel.js';
import loaderSchema, { ILoaderSchema } from './schemas/loaderSchema.js';
import inanimateRefSchema, { IInanimateRefSchema } from './schemas/inanimateRefSchema.js';
import asyncForEach from '../../lib/asyncForEach.js';
import log from '../../lib/log.js';

interface IPortalSchema {
  direction: string;
  destinationId: mongoose.Types.ObjectId;
  doorId?: mongoose.Types.ObjectId;
};

const portalSchema = new mongoose.Schema<IPortalSchema>({
  direction: { type: String, required: true, enum: ['up', 'down', 'east', 'west', 'north', 'south', 'northeast', 'northwest', 'southeast', 'southwest'], },
  destinationId: { type: mongoose.Schema.Types.ObjectId, required: true },
  doorId: { type: mongoose.Schema.Types.ObjectId },
}, {
  timestamps: true,
});

interface IRoomSchema {
  name: string;
  areaId?: mongoose.Types.ObjectId;
  description?: string;
  characterIds: mongoose.Types.ObjectId[];
  inanimates: IInanimateRefSchema[];
  spawnerIds: mongoose.Types.ObjectId[];
  exits: IPortalSchema[];
  loadInfo: ILoaderSchema;
}

interface IDoorLoadModel {
  direction: string;
  loadId: string;
  doorLoadId?: string;
};

export interface IRoomLoadModel extends ILoaderSchema {
  name: string;
  description: string;
  areaLoadId?: string;
  exits: IDoorLoadModel[];
  spawnerLoadIds: string[];
};

type updateFromLoadFn = (loadedObject: IRoomLoadModel) => Promise<void>;
type updateFromLoadRefsFn = (loadedObject: IRoomLoadModel) => Promise<void>;
interface IRoomMethodsAndOverrides {
  loadInfo: mongoose.Types.Subdocument & ILoaderSchema;
  inanimates: IInanimateRefSchema[];
  exits: IPortalSchema[];
  updateFromLoad: updateFromLoadFn;
  updateFromLoadRefs: updateFromLoadRefsFn;
};

interface IRoomModel extends mongoose.Model<IRoomSchema, {}, IRoomMethodsAndOverrides> {
  findByLoadId(loadId: string): Promise<any>;
};

const roomSchema = new mongoose.Schema<IRoomSchema, IRoomModel, IRoomMethodsAndOverrides>({
  name: { type: String, required: true },
  areaId: { type: mongoose.Schema.Types.ObjectId },
  description: { type: String, default: '' },
  characterIds: [{ type: mongoose.Schema.Types.ObjectId }],
  inanimates: [{ type: inanimateRefSchema }],
  spawnerIds: [{ type: mongoose.Schema.Types.ObjectId }],
  exits: [{ type: portalSchema }],
  loadInfo: { type: loaderSchema, default: (val: any) => ({ loadId: '', version: 0 }) },
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
roomSchema.static('findByLoadId', async function(loadId) {
  return RoomModel.findOne({ 'loadInfo.loadId': loadId });
});

/**
 * Update this object from the externally loaded object
 *
 * Note that this does not save the RoomModel.
 *
 * @param {Object} loadedObject - The externally provided object
 */
roomSchema.method('updateFromLoad', async function(loadedObject: IRoomLoadModel) {
  if (this.loadInfo.version >= loadedObject.version) {
    return;
  }
  if (this.loadInfo.loadId !== loadedObject.loadId) {
    return;
  }

  this.name = loadedObject.name;
  this.description = loadedObject.description;
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
 * @param {Object} loadedObject - The externally provided object
 */
roomSchema.method('updateFromLoadRefs', async function(loadedObject: IRoomLoadModel) {
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

  const exits:IPortalSchema[] = [];
  await asyncForEach<IDoorLoadModel>(loadedObject.exits, async (exit) => {
    const destinationRoom = await RoomModel.findByLoadId(exit.loadId);
    if (!destinationRoom) {
      log.error({ roomId: this._id, roomLoadId: exit.loadId }, 'Unable to find room');
      return;
    }

    const exitInfo: IPortalSchema = {
      direction: exit.direction,
      destinationId: destinationRoom._id,
    };

    if (exit.doorLoadId) {
      const door = await DoorModel.findByLoadId(exit.doorLoadId);
      if (!door) {
        log.error({ roomId: this._id, doorLoadId: exit.doorLoadId }, 'Unable to find door');
        return;
      }
      exitInfo.doorId = door._id;
    }

    exits.push(exitInfo);
  });

  if (exits.length !== loadedObject.exits?.length) {
    throw new Error(`Unable to load all exits for room ${this._id}`);
  }
  this.exits = [...exits];

  if (loadedObject.spawnerLoadIds) {
    const spawnerIds: mongoose.Types.ObjectId[] = [];

    await asyncForEach<string>(loadedObject.spawnerLoadIds, async (spawnerLoadId) => {
      const spawner = await SpawnerModel.findByLoadId(spawnerLoadId);
      if (!spawner) {
        log.error({ roomId: this._id, spawnerLoadId }, 'Unable to find spawner');
        return;
      }
      spawnerIds.push(spawner._id);
    });

    if (spawnerIds.length !== loadedObject.spawnerLoadIds.length) {
      throw new Error(`Unable to load all spawners from room ${this._id}`);
    }
    this.spawnerIds = [...spawnerIds];
  }
});

const RoomModel = mongoose.model<IRoomSchema, IRoomModel, IRoomMethodsAndOverrides>('Room', roomSchema);

export default RoomModel;
