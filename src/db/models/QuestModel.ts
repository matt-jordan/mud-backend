//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import mongoose from 'mongoose';

import loaderSchema, { ILoaderSchema } from './schemas/loaderSchema.js';

interface IQuestRewardSchema {
  rewardType: string;
  data?: any;
};

const questRewardSchema = new mongoose.Schema<IQuestRewardSchema>({
  rewardType: { type: String, required: true, enum: ['faction', 'currency'] },
  data: { type: mongoose.Schema.Types.Mixed },
});

interface IQuestEventSchema {
  text: string;
};

const questEventSchema = new mongoose.Schema<IQuestEventSchema>({
  text: { type: String },
});

interface IQuestStageSchema {
  onStatusCheck?: IQuestEventSchema;
  onAccept?: IQuestEventSchema;
  onCompletion?: IQuestEventSchema;
  questType: string;
  questData?: any;
  rewards: IQuestRewardSchema[];
};

const questStageSchema = new mongoose.Schema<IQuestStageSchema>({
  onStatusCheck: { type: questEventSchema },
  onAccept: { type: questEventSchema },
  onCompletion: { type: questEventSchema },
  questType: { type: String, required: true, enum: [ 'assassination' ]},
  questData: { type: mongoose.Schema.Types.Mixed },
  rewards: [{ type: questRewardSchema }],
});

interface IQuestRestrictionSchema {
  restrictionType: string;
  data?: any;
};

const questRestrictionSchema = new mongoose.Schema<IQuestRestrictionSchema>({
  restrictionType: { type: String, required: true, enum: ['faction', 'level']},
  data: { type: mongoose.Schema.Types.Mixed },
});

interface IQuestActiveParticipants {
  characterId: mongoose.Types.ObjectId;
  activeStageIndex: Number;
  activeStageState: Number;
  activeStageData?: any;
};

const questActiveParticipants = new mongoose.Schema<IQuestActiveParticipants>({
  characterId: { type: mongoose.Schema.Types.ObjectId, required: true },
  activeStageIndex: { type: Number, required: true },
  activeStageState: { type: Number, default: 0 },
  activeStageData: { type: mongoose.Schema.Types.Mixed },
});

interface IQuestSchema {
  name: string;
  description?: string;
  questGiver?: string;
  restrictions: IQuestRestrictionSchema[];
  stages: IQuestStageSchema[];
  activeParticipants: IQuestActiveParticipants[];
  loadInfo: ILoaderSchema;
}

export interface IQuestLoadSchema extends ILoaderSchema {
  name: string;
  description?: string;
  questGiver?: string;
  restrictions: IQuestRestrictionSchema[];
  stages: IQuestStageSchema[];
};

type updateFromLoadFn = (loadedObject: IQuestLoadSchema) => Promise<void>;
type updateFromLoadRefsFn = (loadedObject: IQuestLoadSchema) => Promise<void>;
interface IQuestMethodsAndOverrides {
  loadInfo: mongoose.Types.Subdocument & ILoaderSchema;
  updateFromLoad: updateFromLoadFn;
  updateFromLoadRefs: updateFromLoadRefsFn;
};

interface IQuestModel extends mongoose.Model<IQuestSchema, {}, IQuestMethodsAndOverrides> {
  findByLoadId(loadId: string): Promise<IQuestModel>;
  findByQuestGiver(characterRef: string): Promise<IQuestModel>;
};


const questSchema = new mongoose.Schema<IQuestSchema, IQuestModel, IQuestMethodsAndOverrides>({
  loadInfo: { type: loaderSchema, default: (val: any) => ({ loadId: '', version: 0 }) },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  questGiver: { type: String },
  restrictions: [{ type: questRestrictionSchema }],
  stages: [{ type: questStageSchema }],
  activeParticipants: [{ type: questActiveParticipants }],
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
questSchema.static('findByLoadId', async function(loadId: string) {
  return QuestModel.findOne({ 'loadInfo.loadId': loadId });
});

/**
 * Find Quests by their quest giver
 *
 * @param {String} characterRef - The character reference
 *
 * @returns {Array}
 */
questSchema.static('findByQuestGiver', async function(characterRef: string) {
  return QuestModel.find({ questGiver: characterRef });
});

/**
 * Update this object from the externally loaded object
 *
 * Note that this does not save the model.
 *
 * @param {Object} loadedObject - The externally provided object
 */
questSchema.method('updateFromLoad', async function(loadedObject: IQuestLoadSchema) {
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
questSchema.method('updateFromLoadRefs', async function(loadedObject: IQuestLoadSchema) {
  if (this.loadInfo.version >= loadedObject.version) {
    return;
  }
  if (this.loadInfo.loadId !== loadedObject.loadId) {
    return;
  }
});

const QuestModel = mongoose.model<IQuestSchema, IQuestModel, IQuestMethodsAndOverrides>('Quest', questSchema);

export default QuestModel;
