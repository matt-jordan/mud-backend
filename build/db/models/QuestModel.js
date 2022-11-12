//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import mongoose from 'mongoose';
import loaderSchema from './schemas/loaderSchema.js';
;
const questRewardSchema = new mongoose.Schema({
    rewardType: { type: String, required: true, enum: ['faction', 'currency'] },
    data: { type: mongoose.Schema.Types.Mixed },
});
;
const questEventSchema = new mongoose.Schema({
    text: { type: String },
});
;
const questStageSchema = new mongoose.Schema({
    onStatusCheck: { type: questEventSchema },
    onAccept: { type: questEventSchema },
    onCompletion: { type: questEventSchema },
    questType: { type: String, required: true, enum: ['assassination'] },
    questData: { type: mongoose.Schema.Types.Mixed },
    rewards: [{ type: questRewardSchema }],
});
;
const questRestrictionSchema = new mongoose.Schema({
    restrictionType: { type: String, required: true, enum: ['faction', 'level'] },
    data: { type: mongoose.Schema.Types.Mixed },
});
;
const questActiveParticipants = new mongoose.Schema({
    characterId: { type: mongoose.Schema.Types.ObjectId, required: true },
    activeStageIndex: { type: Number, required: true },
    activeStageState: { type: Number, default: 0 },
    activeStageData: { type: mongoose.Schema.Types.Mixed },
});
;
;
;
const questSchema = new mongoose.Schema({
    loadInfo: { type: loaderSchema, default: (val) => ({ loadId: '', version: 0 }) },
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
questSchema.static('findByLoadId', function (loadId) {
    return __awaiter(this, void 0, void 0, function* () {
        return QuestModel.findOne({ 'loadInfo.loadId': loadId });
    });
});
/**
 * Find Quests by their quest giver
 *
 * @param {String} characterRef - The character reference
 *
 * @returns {Array}
 */
questSchema.static('findByQuestGiver', function (characterRef) {
    return __awaiter(this, void 0, void 0, function* () {
        return QuestModel.find({ questGiver: characterRef });
    });
});
/**
 * Update this object from the externally loaded object
 *
 * Note that this does not save the model.
 *
 * @param {Object} loadedObject - The externally provided object
 */
questSchema.method('updateFromLoad', function (loadedObject) {
    return __awaiter(this, void 0, void 0, function* () {
        if (this.loadInfo.version >= loadedObject.version) {
            return;
        }
        if (this.loadInfo.loadId !== loadedObject.loadId) {
            return;
        }
        this.name = loadedObject.name;
        this.description = loadedObject.description;
        this.questGiver = loadedObject.questGiver;
        this.restrictions = [...loadedObject.restrictions];
        this.stages = [...loadedObject.stages];
    });
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
questSchema.method('updateFromLoadRefs', function (loadedObject) {
    return __awaiter(this, void 0, void 0, function* () {
        if (this.loadInfo.version >= loadedObject.version) {
            return;
        }
        if (this.loadInfo.loadId !== loadedObject.loadId) {
            return;
        }
    });
});
const QuestModel = mongoose.model('Quest', questSchema);
export default QuestModel;
