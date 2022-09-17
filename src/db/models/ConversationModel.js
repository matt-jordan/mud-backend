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

const characterConversationData = new Schema({
  characterId: { type: String, required: true },
  lastState: { type: String },
  visits: { type: Number },
});

const conversationTextTriggerSchema = new Schema({
  textId: { type: String, required: true },
  triggerType: { type: String, required: true },
  triggerData: { type: String, required: true },
  textLocation: { type: String, required: true },
  text: { type: String, required: true },
});

const conversationStateTriggerSchema = new Schema({
  triggerText: { type: String, required: true },
  state: { type: String, required: true },
});

const conversationStateSchema = new Schema({
  name: { type: String, required: true },
  text: { type: String },
  transitions: [{ type: conversationStateTriggerSchema }],
  textTriggers: [{ type: conversationTextTriggerSchema }],
});

const conversationEventSchema = new Schema({
  state: { type: String },
  say: { type: String },
});

const conversationSchema = new Schema({
  onAttack: { type: conversationEventSchema },
  onDeath: { type: conversationEventSchema },
  onSay: { type: conversationEventSchema },
  states: [{ type: conversationStateSchema }],
  characterData: [{ type: characterConversationData }],
  loadInfo: { type: loaderSchema, default: {} },
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
conversationSchema.statics.findByLoadId = async function(loadId) {
  return ConversationModel.findOne({ 'loadInfo.loadId': loadId });
};

/**
 * Update this object from the externally loaded object
 *
 * Note that this does not save the model.
 *
 * @param {Object} loadedObject - The externally provided object
 */
conversationSchema.methods.updateFromLoad = async function(loadedObject) {
  if (this.loadInfo.version >= loadedObject.version) {
    return;
  }
  if (this.loadInfo.loadId !== loadedObject.loadId) {
    return;
  }

  if (loadedObject.onSay) {
    this.onSay = {};
    this.onSay.state = loadedObject.onSay.state;
    this.onSay.say = loadedObject.onSay.say;
  }

  if (loadedObject.onAttack) {
    this.onAttack = {};
    this.onAttack.state = loadedObject.onAttack.state;
    this.onAttack.say = loadedObject.onAttack.say;
  }

  if (loadedObject.onDeath) {
    this.onDeath = {};
    this.onDeath.state = loadedObject.onDeath.state;
    this.onDeath.say = loadedObject.onDeath.say;
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
};

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
conversationSchema.methods.updateFromLoadRefs = async function(loadedObject) {
  if (this.loadInfo.version >= loadedObject.version) {
    return;
  }
  if (this.loadInfo.loadId !== loadedObject.loadId) {
    return;
  }
};


const ConversationModel = mongoose.model('Conversation', conversationSchema);

export default ConversationModel;