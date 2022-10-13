//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

/**
 * @module game/characters/helpers/Conversation
 */

import log from '../../../lib/log.js';

/**
 * An actual state in the conversation
 *
 * Conversation states contain all the interesting bits that happen when a character
 * is talking to an NPC. This includes both the logic for what to say to the character,
 * as well as the transitions to the next phase in the conversation.
 */
class ConversationState {

  /**
   * Make a new ConversationState
   *
   * @param {Character} character - The character who will speak
   * @param {String}    id        - Unique ID of the state
   * @param {String}    text      - The text to display
   */
  constructor(character, id, text) {
    this.character = character;
    this.id = id;
    this.transitions = {};
    this.textTriggers = [];
    this.text = text;
    this.visits = 0;

    this.triggerFunctions = {
      visits: (triggerDef, state) => {
        // We could build something super complex here, but let's just start with
        // the two cases we care about right now and build something more generic
        // over time
        switch (triggerDef.triggerData) {
        case '0':
          return (state.visits === 0);
        case '>0':
          return (state.visits > 0);
        default:
          log.warn({ triggerData: triggerDef.triggerData }, 'Unknown trigger data used in Conversation state');
          break;
        }
        return false;
      },
    };
  }

  /**
   * Add a transition out of this state
   *
   * @param {String}            trigger - The text to trigger on
   * @param {ConversationState} state   - The state to move to
   */
  addTransition(trigger, state) {
    this.transitions[trigger] = state;
  }

  /**
   * Add a text manipulation trigger
   *
   * @param {Object} triggerDef
   * @param {String} triggerDef.textId       - Unique ID of the trigger.
   * @param {String} triggerDef.triggerType  - The type of trigger. Currently only 'visits'.
   * @param {String} triggerDef.triggerData  - Data that manipulates the triggerType.
   * @param {String} triggerDef.textLocation - Where to place the text. Currently just 'pre'.
   * @param {String} triggerDef.text         - The text to display
   */
  addTextTrigger(triggerDef) {
    this.textTriggers.push({
      textId: triggerDef.textId,
      triggerType: triggerDef.triggerType,
      triggerData: triggerDef.triggerData,
      textLocation: triggerDef.textLocation,
      text: triggerDef.text,
    });
  }

  /**
   * Transform text before sending it to the recipient
   *
   * @param {String}    text      - The text to send
   * @param {Character} recipient - The Character who will receive the text
   *
   * @returns {String}
   */
  applyTextTransformation(text, recipient) {
    let newText;

    newText = text.replace('{{character}}', recipient.toShortText());

    return newText;
  }

  /**
   * Get the text for this state that should be sent to the recipient
   *
   * @param {Character} recipient - The Character to receive the text
   *
   * @returns {String}
   */
  getText(recipient) {
    let responseText = this.applyTextTransformation(this.text, recipient);

    this.textTriggers.forEach((triggerDef) => {
      let showText = true;

      if (triggerDef.triggerType && this.triggerFunctions[triggerDef.triggerType]) {
        showText = this.triggerFunctions[triggerDef.triggerType](triggerDef, this);
      }

      if (showText) {
        const triggerText = this.applyTextTransformation(triggerDef.text, recipient);
        switch (triggerDef.textLocation) {
        case 'pre':
          responseText = `${triggerText} ${responseText}`;
          break;
        default:
          log.warn({ textLocation: triggerDef.textLocation }, 'Unknown textTrigger location');
          break;
        }
      }
    });

    return responseText;
  }

  /**
   * Execute the state
   *
   * @param {Character} speaker        - The character speaking
   * @param {String}    triggeringText - The message they spoke
   *
   * @returns {ConversationState} - new state, or null if no state was executed
   */
  execute(speaker, triggeringText) {
    let executableState = this;

    const triggers = Object.keys(this.transitions);
    const matchingTrigger = triggers.find(t => triggeringText.includes(t));
    if (!matchingTrigger) {
      return null;
    }

    // Faction checks!
    const factions = this.character.factions.factionScores();
    const result = factions.every((faction) => {
      const speakerScore = speaker.factions.factionScore(faction.name);
      if ((faction.score <= 40 && speakerScore > 40) || (faction.score > 40 && speakerScore <= 40)) {
        return false;
      }
      return true;
    });
    if (!result) {
      speaker.sendImmediate(`${this.character.toShortText()} refuses to speak with you.`);
      return;
    }

    executableState = this.transitions[matchingTrigger];
    log.debug({ matchingTrigger, stateId: this.id, newStateId: executableState.id }, 'Found matching text, moving to new state');

    const responseText = executableState.getText(speaker);
    this.character.room.sendImmediate([this.character],
      {
        socialType: 'say',
        language: this.character.language || 'common',
        sender: `${this.character.toShortText()}`,
        text: responseText,
      }
    );

    executableState.visits += 1;
    return executableState;
  }
}

/**
 * A state machine for a conversation
 *
 * This is really just a thin wrapper over a dictionary of states, but it does
 * enough to construct the states from the provided model and keep track of the
 * state that we're currently on
 */
class ConversationStateManager {

  /**
   * Create a new state machine
   *
   * @param {Character}         character    - The Character model who will talk
   * @param {String}            initialState - Name of the state we should start on
   * @param {ConversationModel} model        - The model for the states
   */
  constructor(character, initialState, model) {
    this.character = character;
    this.initialState = null;
    this.currentState = null;
    this.states = {};

    // Do a two-pass over the state definitions so that the transitions point
    // to an instance of the next state
    model.states.forEach((stateDef) => {
      this.states[stateDef.name] = new ConversationState(character, stateDef.name, stateDef.text);
      if (stateDef.textTriggers) {
        stateDef.textTriggers.forEach((textTriggerDef) => {
          this.states[stateDef.name].addTextTrigger(textTriggerDef);
        });
      }
    });
    model.states.filter((stateDef) => stateDef.transitions).forEach((stateDef) => {
      stateDef.transitions.forEach((transitionDef) => {
        this.states[stateDef.name].addTransition(
          transitionDef.triggerText,
          this.states[transitionDef.state]);
      });
    });

    this.currentState = this.states[initialState];
    this.initialState = this.currentState;
    log.debug({ currentState: this.currentState.id }, 'Current conversation state');
  }

  /**
   * Attempt to execute a conversation transition
   *
   * @param {Character} speaker        - The character who spoke in the room
   * @param {String}    triggeringText - The message they said
   */
  execute(speaker, triggeringText) {
    const newState = this.currentState.execute(speaker, triggeringText);
    if (newState) {
      log.debug({ currentState: this.currentState.id }, 'Current conversation state');
      this.currentState = newState;
    }
  }
}

/**
 * Class that manages conversations on a character
 */
class Conversation {

  /**
   * Make a new conversation
   *
   * @param {ConversationModel} model     - The underlying model for the conversation
   * @param {Character}         character - The character who owns the conversation
   */
  constructor(model, character) {
    this.model = model;
    this.character = character;
    this.conversationState = {};
  }

  /**
   * Someone said something!
   *
   * @param {Character} packet  - The packet that was sent to the character
   * @param {String}    message - The message the speaker said (interpreted)
   * @param {Room}      room    - The room where they said a thing
   */
  async onSay(packet, message, room) {
    const sayers = packet.senders;
    if (!sayers || sayers.length === 0 || !room || packet?.message?.socialType !== 'say') {
      return;
    }

    // We just look at the first speaker, since having multiple people talk
    // is sort of not a thing anyway. Note that there is a 'sayer' when a person
    // leaves a room, but they won't be in the room any longer. If we care to
    // later, we can use that as a sign that a person has left a conversation.
    const speaker = room.characters.all.find(c => c.id === sayers[0]);
    if (!speaker) {
      return;
    }

    if (!this.conversationState[speaker.id]) {
      this.conversationState[speaker.id] = new ConversationStateManager(
        this.character,
        this.model.onSay.state,
        this.model,
      );
    }
    this.conversationState[speaker.id].execute(speaker, message.toLowerCase());
  }

  /**
   * Someone hit us!
   *
   * @param {Character} attacker - The character who smacked us around
   * @param {Room}      room     - The room where they did the aggression
   */
  onAttack(attacker, room) {

  }

  /**
   * We died :-(
   *
   * @param {Character} killer - The character who may have killed us
   * @param {Room}      room   - The room where we died
   */
  onDeath(killer, room) {

  }

  /**
   * Load the state of the conversation from the model
   */
  async load() {
    if (!this.model.characterData) {
      return;
    }

    this.model.characterData.forEach((characterData) => {
      const manager = new ConversationStateManager(
        this.character,
        characterData.lastState ? characterData.lastState : this.model.onSay.state,
        this.model);
      manager.initialState.visits = characterData.visits;

      this.conversationState[characterData.characterId] = manager;
    });
  }

  /**
   * Save the state of the conversation
   */
  async save() {
    this.model.characterData = Object.keys(this.conversationState).map((characterId) => {
      const manager = this.conversationState[characterId];
      return {
        characterId,
        lastState: manager.currentState.id,
        visits: manager.initialState.visits,
      };
    });

    await this.model.save();
  }

}

export default Conversation;
