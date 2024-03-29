//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import conversationTransformation from '../helpers/conversationTransformation.js';
import log from '../../../lib/log.js';

/**
 * @module game/characters/quests/QuestStage
 */

/**
 * A stage in a quest
 */
class QuestStage {

  /**
   * Create a stage in the quest
   */
  constructor(model, strategy, rewards) {
    this.model = model;
    this.strategy = strategy;
    this.rewards = rewards;
  }

  /**
   * Convert this quest stage into a text description
   *
   * @param {QuestState} state - The state of the quest
   *
   * @returns {String}
   */
  toText(state) {
    return this.strategy.toText(state);
  }

  /**
   * Called when the speaker has accepted this quest stage
   *
   * @param {Character}  character - The character who owns the quest
   * @param {String}     actorId   - The ID of the character who accepted the quest
   * @param {QuestState} state     - The state object for the actor
   */
  accept(character, actorId, state) {
    const actor = character.world.characters.find((c) => c.id === actorId);
    if (!actor) {
      log.warn({ actorId, characterId: character.id }, 'Failed to find actor in quest stage');
      return;
    }

    this.strategy.accept(actor, state);

    if (!(this.model.onAccept) || !(this.model.onAccept.text)) {
      return;
    }
    const { text = null } = this.model.onAccept;
    character.room.sendImmediate([character],
      {
        socialType: 'say',
        language: character.language || 'common',
        sender: `${character.toShortText()}`,
        text: conversationTransformation(text, actor),
      }
    );
  }

  /**
   * Called when the speaker checks the status of the quest stage
   *
   * @param {Character}  character - The character who owns the quest
   * @param {String}     actorId   - The ID of the character who accepted the quest
   * @param {QuestState} state     - The state object for the actor
   */
  checkStatus(character, actorId, state) {
    const actor = character.world.characters.find((c) => c.id === actorId);
    if (!actor) {
      log.warn({ actorId, characterId: character.id }, 'Failed to find actor in quest stage');
      return;
    }

    this.strategy.checkStatus(character, actor, state);

    if (!(this.model.onStatusCheck) || !(this.model.onStatusCheck.text)) {
      return;
    }

    const { text } = this.model.onStatusCheck;
    character.room.sendImmediate([character],
      {
        socialType: 'say',
        language: character.language || 'common',
        sender: `${character.toShortText()}`,
        text: conversationTransformation(text, actor),
      }
    );
  }

  /**
   * Called when the speaker checks the status of the quest stage
   *
   * @param {Character}  character - The character who owns the quest
   * @param {String}     actorId   - The ID of the character who accepted the quest
   * @param {QuestState} state     - The state object for the actor
   */
  complete(character, actorId, state) {
    const actor = character.world.characters.find((c) => c.id === actorId);
    if (!actor) {
      log.warn({ actorId, characterId: character.id }, 'Failed to find actor in quest stage');
      return;
    }

    this.strategy.complete(character, actor, state);

    if (this.rewards) {
      this.rewards.forEach((reward) => {
        reward.reward(character, actor, state);
      });
    }

    if ((this.model.onCompletion) && (this.model.onCompletion.text)) {
      const { text } = this.model.onCompletion;
      character.room.sendImmediate([character],
        {
          socialType: 'say',
          language: character.language || 'common',
          sender: `${character.toShortText()}`,
          text: conversationTransformation(text, actor),
        }
      );
    }
  }

  /**
   * Perform a one-time only backdoor load of the character
   *
   * @param {Character}  actor - The actor of the quest
   * @param {QuestState} state - Their current state
   */
  loadCharacter(actor, state) {
    // For now, all this does is re-call accept without sending any text. Depending
    // on future strategies, we may need to do more than that.
    this.strategy.accept(actor, state);
  }
}

export default QuestStage;