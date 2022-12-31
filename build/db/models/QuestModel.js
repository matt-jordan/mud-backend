"use strict";
//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const loaderSchema_js_1 = __importDefault(require("./schemas/loaderSchema.js"));
;
const questRewardSchema = new mongoose_1.default.Schema({
    rewardType: { type: String, required: true, enum: ['faction', 'currency'] },
    data: { type: mongoose_1.default.Schema.Types.Mixed },
});
;
const questEventSchema = new mongoose_1.default.Schema({
    text: { type: String },
});
;
const questStageSchema = new mongoose_1.default.Schema({
    onStatusCheck: { type: questEventSchema },
    onAccept: { type: questEventSchema },
    onCompletion: { type: questEventSchema },
    questType: { type: String, required: true, enum: ['assassination'] },
    questData: { type: mongoose_1.default.Schema.Types.Mixed },
    rewards: [{ type: questRewardSchema }],
});
;
const questRestrictionSchema = new mongoose_1.default.Schema({
    restrictionType: { type: String, required: true, enum: ['faction', 'level'] },
    data: { type: mongoose_1.default.Schema.Types.Mixed },
});
;
const questActiveParticipants = new mongoose_1.default.Schema({
    characterId: { type: mongoose_1.default.Schema.Types.ObjectId, required: true },
    activeStageIndex: { type: Number, required: true },
    activeStageState: { type: Number, default: 0 },
    activeStageData: { type: mongoose_1.default.Schema.Types.Mixed },
});
;
;
;
const questSchema = new mongoose_1.default.Schema({
    loadInfo: { type: loaderSchema_js_1.default, default: (val) => ({ loadId: '', version: 0 }) },
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
questSchema.static('findByLoadId', async function (loadId) {
    return QuestModel.findOne({ 'loadInfo.loadId': loadId });
});
/**
 * Find Quests by their quest giver
 *
 * @param {String} characterRef - The character reference
 *
 * @returns {Array}
 */
questSchema.static('findByQuestGiver', async function (characterRef) {
    return QuestModel.find({ questGiver: characterRef });
});
/**
 * Update this object from the externally loaded object
 *
 * Note that this does not save the model.
 *
 * @param {Object} loadedObject - The externally provided object
 */
questSchema.method('updateFromLoad', async function (loadedObject) {
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
questSchema.method('updateFromLoadRefs', async function (loadedObject) {
    if (this.loadInfo.version >= loadedObject.version) {
        return;
    }
    if (this.loadInfo.loadId !== loadedObject.loadId) {
        return;
    }
});
const QuestModel = mongoose_1.default.model('Quest', questSchema);
exports.default = QuestModel;
