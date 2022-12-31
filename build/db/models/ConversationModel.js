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
const characterConversationData = new mongoose_1.default.Schema({
    characterId: { type: String, required: true },
    lastState: { type: String },
    visits: { type: Number, default: 0 },
});
;
const conversationTextTriggerSchema = new mongoose_1.default.Schema({
    textId: { type: String, required: true },
    triggerType: { type: String },
    triggerData: { type: String },
    textLocation: { type: String, required: true },
    text: { type: String, required: true },
});
;
const conversationStateTriggerSchema = new mongoose_1.default.Schema({
    triggerText: { type: String, required: true },
    state: { type: String, required: true },
});
;
const conversationStateSchema = new mongoose_1.default.Schema({
    name: { type: String, required: true },
    text: { type: String },
    transitions: [{ type: conversationStateTriggerSchema }],
    textTriggers: [{ type: conversationTextTriggerSchema }],
});
;
const conversationEventSchema = new mongoose_1.default.Schema({
    state: { type: String },
    say: { type: String },
});
;
;
;
;
const conversationSchema = new mongoose_1.default.Schema({
    onAttack: { type: conversationEventSchema },
    onDeath: { type: conversationEventSchema },
    onSay: { type: conversationEventSchema },
    states: [{ type: conversationStateSchema }],
    characterData: [{ type: characterConversationData }],
    loadInfo: { type: loaderSchema_js_1.default, default: (val) => ({ loadId: '', version: 0 }) },
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
conversationSchema.static('findByLoadId', async function (loadId) {
    return ConversationModel.findOne({ 'loadInfo.loadId': loadId });
});
/**
 * Update this object from the externally loaded object
 *
 * Note that this does not save the model.
 *
 * @param {Object} loadedObject - The externally provided object
 */
conversationSchema.method('updateFromLoad', async function (loadedObject) {
    if (this.loadInfo.version >= loadedObject.version) {
        return;
    }
    if (this.loadInfo.loadId !== loadedObject.loadId) {
        return;
    }
    if (loadedObject.onSay) {
        this.onSay = {
            state: loadedObject.onSay.state,
            say: loadedObject.onSay.say,
        };
    }
    if (loadedObject.onAttack) {
        this.onAttack = {
            state: loadedObject.onAttack.state,
            say: loadedObject.onAttack.say,
        };
    }
    if (loadedObject.onDeath) {
        this.onDeath = {
            state: loadedObject.onDeath.state,
            say: loadedObject.onDeath.say,
        };
    }
    if (loadedObject.states) {
        this.states = loadedObject.states.map((stateData) => {
            const state = { name: stateData.name };
            if (stateData.text) {
                state.text = stateData.text;
            }
            if (stateData.transitions) {
                state.transitions = [...stateData.transitions];
            }
            if (stateData.textTriggers) {
                state.textTriggers = [...stateData.textTriggers];
            }
            return state;
        });
    }
});
/**
 * Post-process any IDs that were referenced by the externally loaded object
 *
 * In order to prevent ordering issues, loading an external object first loads
 * all the properties that have to exist (see updateFromLoad). It then updates
 * properties in this method that reference other objects.
 *
 * Note that this does not save the model.
 *
 * @param {Object} loadedObject - The externally provided object
 */
conversationSchema.method('updateFromLoadRefs', async function (loadedObject) {
    if (this.loadInfo.version >= loadedObject.version) {
        return;
    }
    if (this.loadInfo.loadId !== loadedObject.loadId) {
        return;
    }
});
const ConversationModel = mongoose_1.default.model('Conversation', conversationSchema);
exports.default = ConversationModel;
