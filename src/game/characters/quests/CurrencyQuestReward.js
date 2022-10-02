//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import log from '../../../lib/log.js';

/**
 * @module game/characters/quests/CurrencyQuestReward
 */

/**
 * Create a quest reward that gives currency to the actor
 */
class CurrencyQuestReward {

  /**
   * Create a new currency quest reward
   *
   * @param {Object} model
   * @param {String} model.rewardType = 'currency' - The type of reward
   * @param {Object} model.data
   * @param {String} model.data.name               - The type of currency to award
   * @param {Number} model.data.quantity           - How much to give
   */
  constructor(model) {
    this.model = model;
  }

  /**
   * Issue the reward to the actor of the quest
   *
   * @param {Character}  character - The character who granted the quest
   * @param {Character}  actor     - The actor of the quest
   * @param {QuestState} state     - The quest state object
   */
  reward(character, actor, state) {
    const { name, quantity } = this.model.data;

    // NOTE: This is in another branch :-(
    // We'll come back and finish this up.
    // actor.currencies.deposit()
  }
}

export default CurrencyQuestReward;