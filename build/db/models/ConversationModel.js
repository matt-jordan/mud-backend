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
const characterConversationData = new mongoose.Schema({
    characterId: { type: String, required: true },
    lastState: { type: String },
    visits: { type: Number, default: 0 },
});
;
const conversationTextTriggerSchema = new mongoose.Schema({
    textId: { type: String, required: true },
    triggerType: { type: String },
    triggerData: { type: String },
    textLocation: { type: String, required: true },
    text: { type: String, required: true },
});
;
const conversationStateTriggerSchema = new mongoose.Schema({
    triggerText: { type: String, required: true },
    state: { type: String, required: true },
});
;
const conversationStateSchema = new mongoose.Schema({
    name: { type: String, required: true },
    text: { type: String },
    transitions: [{ type: conversationStateTriggerSchema }],
    textTriggers: [{ type: conversationTextTriggerSchema }],
});
;
const conversationEventSchema = new mongoose.Schema({
    state: { type: String },
    say: { type: String },
});
;
;
;
;
const conversationSchema = new mongoose.Schema({
    onAttack: { type: conversationEventSchema },
    onDeath: { type: conversationEventSchema },
    onSay: { type: conversationEventSchema },
    states: [{ type: conversationStateSchema }],
    characterData: [{ type: characterConversationData }],
    loadInfo: { type: loaderSchema, default: (val) => ({ loadId: '', version: 0 }) },
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
conversationSchema.static('findByLoadId', function (loadId) {
    return __awaiter(this, void 0, void 0, function* () {
        return ConversationModel.findOne({ 'loadInfo.loadId': loadId });
    });
});
/**
 * Update this object from the externally loaded object
 *
 * Note that this does not save the model.
 *
 * @param {Object} loadedObject - The externally provided object
 */
conversationSchema.method('updateFromLoad', function (loadedObject) {
    return __awaiter(this, void 0, void 0, function* () {
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
conversationSchema.method('updateFromLoadRefs', function (loadedObject) {
    return __awaiter(this, void 0, void 0, function* () {
        if (this.loadInfo.version >= loadedObject.version) {
            return;
        }
        if (this.loadInfo.loadId !== loadedObject.loadId) {
            return;
        }
    });
});
const ConversationModel = mongoose.model('Conversation', conversationSchema);
export default ConversationModel;
