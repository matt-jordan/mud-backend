//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import mongoose from 'mongoose';

import loaderSchema, { ILoaderSchema } from './schemas/loaderSchema.js';

interface IFactionSchema {
  name: string;
  opposingFactions?: string[];
  supportingFactions?: string[];
  positiveModifier: Number;
  negativeModifier: Number;
  startingValue: Number;
  loadInfo: ILoaderSchema;
};

interface IFactionLoadSchema extends ILoaderSchema {
  name: string;
  opposingFactions?: string[];
  supportingFactions?: string[];
  positiveModifier: Number;
  negativeModifier: Number;
  startingValue: Number;
};

type updateFromLoadFn = (loadedObject: IFactionLoadSchema) => Promise<void>;
type updateFromLoadRefsFn = (loadedObject: IFactionLoadSchema) => Promise<void>;
interface IFactionMethodsAndOverrides {
  loadInfo: mongoose.Types.Subdocument & ILoaderSchema;
  updateFromLoad: updateFromLoadFn;
  updateFromLoadRefs: updateFromLoadRefsFn;
};

interface IFactionModel extends mongoose.Model<IFactionSchema, {}, IFactionMethodsAndOverrides> {
  findByLoadId(loadId: string): Promise<any>;
};

const factionSchema = new mongoose.Schema<IFactionSchema, IFactionModel, IFactionMethodsAndOverrides>({
  name: { type: String, required: true },
  opposingFactions: [{ type: String }],
  supportingFactions: [{ type: String }],
  positiveModifier: { type: Number, default: 1 },
  negativeModifier: { type: Number, default: 1 },
  startingValue: { type: Number, default: 50 },
  loadInfo: { type: loaderSchema, default: (val: any) => ({ loadId: '', version: 0 }) },
});

/**
 * Find a Faction by its external provided loadId
 *
 * @param {String} loadId - The unique ID of the door
 *
 * @returns {FactionModel}
 */
factionSchema.static('findByLoadId', async function(loadId: string) {
  return FactionModel.findOne({ 'loadInfo.loadId': loadId });
});

/**
 * Update this object from the externally loaded object
 *
 * Note that this does not save the FactionModel.
 *
 * @param {Object} loadedObject - The externally provided object
 */
factionSchema.method('updateFromLoad', async function(loadedObject: IFactionLoadSchema) {
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
});

/**
 * Post-process any IDs that were referenced by the externally loaded object
 *
 * In order to prevent ordering issues, loading an external object first loads
 * all the properties that have to exist (see updateFromLoad). It then updates
 * properties in this method that reference other objects.
 *
 * @param {Object} loadedObject - The externally provided object
 */
factionSchema.method('updateFromLoadRefs', async function(loadedObject: IFactionLoadSchema) {
  if (this.loadInfo.version >= loadedObject.version) {
    return;
  }
  if (this.loadInfo.loadId !== loadedObject.loadId) {
    return;
  }
});

const FactionModel = mongoose.model<IFactionSchema, IFactionModel, IFactionMethodsAndOverrides>('Faction', factionSchema);

export default FactionModel;