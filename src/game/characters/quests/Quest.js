//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import AssassinationQuestStrategy from './AssassinationQuestStrategy.js';
import CurrencyQuestReward from './CurrencyQuestReward.js';
import FactionQuestRestriction from './FactionQuestRestriction.js';
import FactionQuestReward from './FactionQuestReward.js';
import LevelQuestRestriction from './LevelQuestRestriction.js';
import QuestStage from './QuestStage.js';
import QuestState from './QuestState.js';
import asyncForEach from '../../../lib/asyncForEach.js';
import log from '../../../lib/log.js';

/**
 * @module game/characters/quests/Quest
 */

/**
 * A quest for a character
 *
 * Each instance of a quest represents the active management of a single quest.
 * That can mean that multiple characters are performing the quest, but it's up
 * to this class to manage if that's allowed, the characters performing it, their
 * state in the quest, etc.
 *
 * The actual quest specifics are deferred to a strategy that is set up on load.
 */
class Quest {

  /**
   * Create a new Quest
   *
   * @param {QuestModel} model     - The underlying DB model for the Quest
   * @param {Character}  character - The owner of the quest
   */
  constructor(model, character) {
    this.model = model;
    this.character = character;
    this.stages = [];
    this.restrictions = [];
    this.characterProgress = {};
  }

  /**
   * Determine if the actor can perform the quest
   *
   * @param {Character} actor - The character wanting to see if they can do the quest
   *
   * @returns {Boolean}
   */
  characterCheck(actor) {
    return this.restrictions.every((r) => r.check(actor));
  }

  /**
   * Perform a status check on the quest
   *
   * @param {Character} actor - The character perforing the status check
   */
  checkStatus(actor) {
    if (!(actor.id in this.characterProgress)) {
      return;
    }

    this.characterProgress[actor.id].checkStatus();
  }

  /**
   * Accept the quest
   *
   * @param {Character} actor - The character accepting the quest
   */
  accept(actor) {
    if (!(actor.id in this.characterProgress)) {
      this.characterProgress[actor.id] = new QuestState(this.character, actor);
      this.characterProgress[actor.id].setStage(this.stages[0], 0);
    }

    this.characterProgress[actor.id].accept();
  }

  /**
   * Complete the quest
   *
   * @param {Character} actor - The character trying to complete the quest
   */
  complete(actor) {
    if (!(actor.id in this.characterProgress)) {
      log.warn({ actorId: actor.id }, 'Unknown actor attempted to complete quest');
      return;
    }

    const state = this.characterProgress[actor.id];
    if (!state.completeStage()) {
      this.checkStatus(actor);
      return;
    }

    const nextIndex = state.stageIndex + 1;
    if (nextIndex > this.stages.length) {
      // QUEST COMPLETE!

      // We need to record some place on the character that they've finished
      // this quest. Some quests may allow them to do it again, which is
      // fine. So we probably want to keep track of their 'max completions'.
    } else {
      state.setStage(this.stages[nextIndex], nextIndex);
    }
  }

  /**
   * Load the model into memory
   */
  async load() {
    // TODO: Load in from the database which characters are doing the quest
    if (this.model.restrictions) {
      this.restrictions = this.model.restrictions.map((restrictionModel) => {
        switch (restrictionModel.restrictionType) {
        case 'faction':
          return new FactionQuestRestriction(restrictionModel);
        case 'level':
          return new LevelQuestRestriction(restrictionModel);
        default:
          throw new Error(`Unknown restrictionType: ${restrictionModel.restrictionType}`);
        }
      });
    }

    this.stages = this.model.stages.map((stage) => {
      let strategy;
      let rewards = [];

      switch (stage.questType) {
      case 'assassination':
        strategy = new AssassinationQuestStrategy(stage.questData);
        break;
      default:
        throw new Error(`Unknown questType: ${this.model.questType}`);
      }

      if (stage.rewards) {
        rewards = stage.rewards.map((rewardModel) => {
          switch (rewardModel.rewardType) {
          case 'faction':
            return new FactionQuestReward(rewardModel);
          case 'currency':
            return new CurrencyQuestReward(rewardModel);
          default:
            throw new Error(`Unknown rewardType: ${rewardModel.rewardType}`);
          }
        });
      }

      return new QuestStage(stage, strategy, rewards);
    });
  }

  /**
   * Save properties of the quest to the DB
   */
  async save() {
    // TODO: Synchronize the characters doing the quest to the DB
    await this.model.save();
  }

}

export default Quest;
