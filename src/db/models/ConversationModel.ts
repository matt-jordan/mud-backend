//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import mongoose from 'mongoose';

import loaderSchema, { ILoaderSchema } from './schemas/loaderSchema.js';

interface ICharacterConversationData {
  characterId: string;
  lastState?: String;
  visits?: Number;
};

const characterConversationData = new mongoose.Schema<ICharacterConversationData>({
  characterId: { type: String, required: true },
  lastState: { type: String },
  visits: { type: Number, default: 0 },
});

interface IConversationTextTriggerSchema {
  textId: string;
  triggerType?: string;
  triggerData?: string;
  textLocation: string;
  text: string;
};

const conversationTextTriggerSchema = new mongoose.Schema<IConversationTextTriggerSchema>({
  textId: { type: String, required: true },
  triggerType: { type: String },
  triggerData: { type: String },
  textLocation: { type: String, required: true },
  text: { type: String, required: true },
});

interface IConversationStateTriggerSchema {
  triggerText: string;
  state: string;
};

const conversationStateTriggerSchema = new mongoose.Schema<IConversationStateTriggerSchema>({
  triggerText: { type: String, required: true },
  state: { type: String, required: true },
});

interface IConversationStateSchema {
  name: string;
  text?: string;
  transitions?: IConversationStateSchema[];
  textTriggers?: IConversationTextTriggerSchema[];
};

const conversationStateSchema = new mongoose.Schema<IConversationStateSchema>({
  name: { type: String, required: true },
  text: { type: String },
  transitions: [{ type: conversationStateTriggerSchema }],
  textTriggers: [{ type: conversationTextTriggerSchema }],
});

interface IConversationEventSchema {
  state: string;
  say: string;
};

const conversationEventSchema = new mongoose.Schema<IConversationEventSchema>({
  state: { type: String },
  say: { type: String },
});

interface IConversationSchema {
  onAttack?: IConversationEventSchema;
  onDeath?: IConversationEventSchema;
  onSay?: IConversationEventSchema;
  states: IConversationStateSchema[];
  characterData: ICharacterConversationData[];
  loadInfo: ILoaderSchema;
};

interface IConversationLoadStatesSchema {
  name: string;
  text?: string;
  transitions?: IConversationStateSchema[];
  textTriggers?: IConversationTextTriggerSchema[];
}

export interface IConversationLoadSchema extends ILoaderSchema {
  onAttack?: IConversationEventSchema;
  onDeath?: IConversationEventSchema;
  onSay?: IConversationEventSchema;
  states?: IConversationLoadStatesSchema[];
};

type updateFromLoadFn = (loadedObject: IConversationLoadSchema) => Promise<void>;
type updateFromLoadRefsFn = (loadedObject: IConversationLoadSchema) => Promise<void>;
interface IConversationMethodsAndOverrides {
  loadInfo: mongoose.Types.Subdocument & ILoaderSchema;
  updateFromLoad: updateFromLoadFn;
  updateFromLoadRefs: updateFromLoadRefsFn;
};

interface IConversationModel extends mongoose.Model<IConversationSchema, {}, IConversationMethodsAndOverrides> {
  findByLoadId(loadId: string): Promise<any>;
};

const conversationSchema = new mongoose.Schema<IConversationSchema, IConversationModel, IConversationMethodsAndOverrides>({
  onAttack: { type: conversationEventSchema },
  onDeath: { type: conversationEventSchema },
  onSay: { type: conversationEventSchema },
  states: [{ type: conversationStateSchema }],
  characterData: [{ type: characterConversationData }],
  loadInfo: { type: loaderSchema, default: (val: any) => ({ loadId: '', version: 0 }) },
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
conversationSchema.static('findByLoadId', async function(loadId: string) {
  return ConversationModel.findOne({ 'loadInfo.loadId': loadId });
});

/**
 * Update this object from the externally loaded object
 *
 * Note that this does not save the model.
 *
 * @param {Object} loadedObject - The externally provided object
 */
conversationSchema.method('updateFromLoad', async function(loadedObject: IConversationLoadSchema) {
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
    this.states = loadedObject.states.map((stateData: IConversationLoadStatesSchema) => {
      const state: any = { name: stateData.name };

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
conversationSchema.method('updateFromLoadRefs', async function(loadedObject: IConversationLoadSchema) {
  if (this.loadInfo.version >= loadedObject.version) {
    return;
  }
  if (this.loadInfo.loadId !== loadedObject.loadId) {
    return;
  }
});

const ConversationModel = mongoose.model<IConversationSchema, IConversationModel, IConversationMethodsAndOverrides>('Conversation', conversationSchema);

export default ConversationModel;