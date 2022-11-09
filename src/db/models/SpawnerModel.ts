//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import mongoose from 'mongoose';
import loaderSchema, { ILoaderSchema } from './schemas/loaderSchema.js';

interface ISpawnerSchema {
  characterFactories?: string[];
  characterSelection?: string;
  triggerType?: string;
  triggerUpperLimit?: Number;
  spawnsPerTrigger?: Number;
  state?: any;
  factoryData?: any;
  loadInfo: ILoaderSchema;
};

export interface ISpawnerLoadModel extends ILoaderSchema {
  characterFactories?: string[];
  characterSelection?: string;
  triggerType?: string;
  triggerUpperLimit?: Number;
  spawnsPerTrigger?: Number;
  state?: any;
  factoryData?: any;
};

type updateFromLoadFn = (loadedObject: ISpawnerLoadModel) => Promise<void>;
type updateFromLoadRefsFn = (loadedObject: ISpawnerLoadModel) => Promise<void>;
interface ISpawnerMethodsAndOverrides {
  loadInfo: mongoose.Types.Subdocument & ILoaderSchema;
  updateFromLoad: updateFromLoadFn;
  updateFromLoadRefs: updateFromLoadRefsFn;
};

interface ISpawnerModel extends mongoose.Model<ISpawnerSchema, {}, ISpawnerMethodsAndOverrides> {
  findByLoadId(loadId: string): Promise<any>;
};

const spawnerSchema = new mongoose.Schema<ISpawnerSchema, ISpawnerModel, ISpawnerMethodsAndOverrides>({
  characterFactories: [{ type: String }],
  characterSelection: { type: String, default: 'random', enum: [ 'random' ]},
  triggerType: { type: String, default: 'tick', enum: [ 'tick' ]},
  triggerUpperLimit: { type: Number, default: 20 },
  spawnsPerTrigger: { type: Number, default: 1 },
  state: { type: mongoose.Schema.Types.Mixed },
  factoryData: { type: mongoose.Schema.Types.Mixed },
  loadInfo: { type: loaderSchema, default: (val: any) => ({ loadId: '', version: 0 }) },
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
 spawnerSchema.static('findByLoadId', function findByLoadId(loadId: string) {
  return SpawnerModel.findOne({ 'loadInfo.loadId': loadId });
});

/**
 * Update this object from the externally loaded object
 *
 * Note that this does not save the SpawnerModel.
 *
 * @param {Object} loadedObject - The externally provided object
 */
spawnerSchema.method('updateFromLoad', async function(loadedObject: ISpawnerLoadModel) {
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
});

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
spawnerSchema.method('updateFromLoadRefs', async function(loadedObject: ISpawnerLoadModel) {
  if (this.loadInfo.version >= loadedObject.version) {
    return;
  }
  if (this.loadInfo.loadId !== loadedObject.loadId) {
    return;
  }
  return;
});

const SpawnerModel = mongoose.model<ISpawnerSchema, ISpawnerModel, ISpawnerMethodsAndOverrides>('Spawner', spawnerSchema);

export default SpawnerModel;