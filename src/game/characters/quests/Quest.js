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
   * @static
   * The one (and only) quest registry
   */
  static #registry = {};

  /**
   * @static
   * Unregister a quest
   *
   * This should be called on when quests are destroyed (@see destroy)
   *
   * @param {Quest} quest - The quest to unregister
   */
  static unregister(quest) {
    if (quest.model.name in Quest.#registry) {
      delete Quest.#registry[quest.model.name];
    }
  }

  /**
   * @static
   * Register a quest
   *
   * This should be called for every created quest, so that actors can look up
   * the quests when needed.
   *
   * @param {Quest} quest - The quest to register
   */
  static register(quest) {
    if (quest.model.name in Quest.#registry) {
      log.warn({ questName: quest.model.name }, 'Re-registering quest');
    }
    Quest.#registry[quest.model.name] = quest;
  }

  /**
   * Get the active quests that a particular actor is on
   *
   * @param {Character} actor  - The actor in the quest
   */
  static activeQuests(actor) {
    const quests = Object.values(Quest.#registry).filter((q) => q.characterOnQuest(actor));
    return quests;
  }

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
   * Provide a progress summary of this actor's progression
   *
   * @param {Character} actor - The actor taking the quest
   *
   * @returns {String}
   */
  toText(actor) {
    if (!(actor.id in this.characterProgress)) {
      return '';
    }

    return `[${this.model.name}] (${this.character.toShortText()}) - ${this.characterProgress[actor.id].toText()}`;
  }

  /**
   * Convert this to a text description of the quest
   *
   * @returns {String}
   */
  toDescription() {
    return `[${this.model.name}]: ${this.model.description}`;
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
   * Checks if the character is on this quest
   *
   * @param {Character} actor - The character who may or may not be on the quest
   *
   * @returns {Boolean}
   */
  characterOnQuest(actor) {
    return (actor.id in this.characterProgress);
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
      this.characterProgress[actor.id] = new QuestState(this.character, actor.id);
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
      log.warn({
        actorId: actor.id,
        characterId: this.character.id,
        questName: this.model.name,
      }, 'Unknown actor attempted to complete quest');
      return;
    }

    const state = this.characterProgress[actor.id];
    if (!state.completeStage()) {
      this.checkStatus(actor);
      return;
    }

    const nextIndex = state.stageIndex + 1;
    if (nextIndex >= this.stages.length) {
      // Quest complete!
      let questData = actor.questsCompleted.find(q => q.questId === this.model.id);
      if (!questData) {
        questData = { questId: this.model.id, completions: 1 };
        actor.questsCompleted.push(questData);
      } else {
        questData.completions += 1;
      }
      log.debug({
        actorId: actor.id,
        questId: this.model.id,
        completions: questData.completions
      }, 'Recording quest completion on actor');
    } else {
      state.setStage(this.stages[nextIndex], nextIndex);
    }
  }

  /**
   * Destroy this quest.
   *
   * This should go through and 'fail' the quest for any active takers.
   */
  async destroy() {
    // TODO

    // We will need to update the Quest model back to the database as we'll have
    // removed the active participants, *and* the Quest giver likely just died
    // (which is the most common way a quest would be destroyed). Since a new
    // quest giver may spawn using this same Quest, we'll need to effectively
    // 'zero out' the participants between then and now.
    await this.save();
  }

  /**
   * Load the model into memory
   */
  async load() {
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

    if (this.model.activeParticipants) {
      this.model.activeParticipants.forEach((participant) => {
        const actorId = participant.characterId.toString();
        const state = new QuestState(this.character, actorId);
        state.setStage(this.stages[participant.activeStageIndex], participant.activeStageIndex, participant.activeStageState);
        state.actorQuestData = participant.activeStageData || {};
        this.characterProgress[actorId] = state;

        log.debug({
          characterId: this.character.id,
          actorId,
          questName: this.model.name,
          stageIndex: state.stageIndex,
          stageState: participant.activeStageState,
        }, 'Resuming quest for character');
      });
    }
  }

  /**
   * Loading is fun.
   *
   * When characters load in, there is no order guaranteed. This means that a quest
   * that an actor is on may not exist when they get loaded, or the quest giver does
   * exist but the actors do not yet. This led to breaking up the load order in Character,
   * but sitll presents the problem that some strategies, such as assassination, requires
   * us to subscribe to the actor when we don't have them in `load`.
   *
   * This method allows a 'backdoor' to reset the state fully on a newly loaded character.
   * It has to be called only once, and only on load. Otherwise, weird things would happen.
   *
   * @param {Character} actor - The actor who was just loaded into the game
   */
  loadCharacter(actor) {
    if (!(actor.id in this.characterProgress)) {
      // The quest giver no longer knows who they are; ignore
      log.info({
        actorId: actor.id,
        characterId: this.character.id,
        questName: this.model.name
      }, 'Quest is no longer known for actor');
      return;
    }
    const state = this.characterProgress[actor.id];
    state.loadCharacter(actor);
  }

  /**
   * Save properties of the quest to the DB
   */
  async save() {
    this.model.activeParticipants = Object.values(this.characterProgress)
      .map((questState) => questState.toJson());
    await this.model.save();
  }
}

export default Quest;
