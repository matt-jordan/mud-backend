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

areaSchema.methods.updateFromLoad = async function(loadedObject) {
  if (this.loadInfo.version <= loadedObject.version) {
    return;
  }
  if (this.loadInfo.loadId !== loadedObject.loadId) {
    return;
  }
  this.name = loadedObject.name;
  this.loadInfo.version = loadedObject.version;
}

const AreaModel = mongoose.model('Area', areaSchema);

export default AreaModel;
