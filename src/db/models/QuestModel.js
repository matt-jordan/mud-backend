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

const questRewardSchema = new Schema({
  rewardType: { type: String, required: true, enum: ['faction', 'currency'] },
  data: { type: Schema.Types.Mixed },
});

const questEventSchema = new Schema({
  text: { type: String },
});

const questStageSchema = new Schema({
  onStatusCheck: { type: questEventSchema },
  onAccept: { type: questEventSchema },
  onCompletion: { type: questEventSchema },
  questType: { type: String, required: true, enum: [ 'assassination' ]},
  questData: { type: Schema.Types.Mixed },
  rewards: [{ type: questRewardSchema }],
});

const questRestrictionSchema = new Schema({
  restrictionType: { type: String, required: true, enum: ['faction', 'level']},
  data: { type: Schema.Types.Mixed },
});

const questSchema = new Schema({
  loadInfo: { type: loaderSchema, default: {} },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  questGiver: { type: String },
  restrictions: [{ type: questRestrictionSchema }],
  stages: [{ type: questStageSchema }],
}, {
  timestamps: true,
});

/**
 * Find a Quest by its external provided loadId
 *
 * @param {String} loadId - The unique ID of the room
 *
 * @returns {QuestModel}
 */
questSchema.statics.findByLoadId = async function(loadId) {
  return QuestModel.findOne({ 'loadInfo.loadId': loadId });
};

/**
 * Find Quests by their quest giver
 *
 * @param {String} characterRef - The character reference
 *
 * @returns {Array}
 */
questSchema.statics.findByQuestGiver = async function(characterRef) {
  return QuestModel.find({ questGiver: characterRef });
}

/**
 * Update this object from the externally loaded object
 *
 * Note that this does not save the model.
 *
 * @param {Object} loadedObject - The externally provided object
 */
questSchema.methods.updateFromLoad = async function(loadedObject) {
  if (this.loadInfo.version >= loadedObject.version) {
    return;
  }
  if (this.loadInfo.loadId !== loadedObject.loadId) {
    return;
  }

  this.name = loadedObject.name;
  this.description = loadedObject.description;
  this.questGiver = loadedObject.questGiver;
  this.restrictions = [ ...loadedObject.restrictions ];
  this.stages = [ ...loadedObject.stages ];
};

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
questSchema.methods.updateFromLoadRefs = async function(loadedObject) {
  if (this.loadInfo.version >= loadedObject.version) {
    return;
  }
  if (this.loadInfo.loadId !== loadedObject.loadId) {
    return;
  }
};

const QuestModel = mongoose.model('Quest', questSchema);

export default QuestModel;
