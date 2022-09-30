//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import EventEmitter from 'events';

import log from '../../../lib/log.js';

/**
 * @module game/characters/quests/QuestState
 */

/**
 * Class that tracks a character's progress through a quest
 *
 * This is the object that holds all *mutable* state for a character. The other
 * classes should generally not be mutable nor should they contain character
 * specific data.
 */
class QuestState extends EventEmitter {

  /**
   * The specific states of the quest
   */
  static get STAGE_STATE() {
    return {
      NOT_STARTED: 0,
      IN_PROGRESS: 1,
      PENDING_COMPLETE: 2,
      COMPLETE: 3,
    };
  }

  /**
   * Create a new quest state
   *
   * @param {Character} character - The character who owns the quest
   * @param {Character} actor     - The actor taking the quest
   */
  constructor(character, actor) {
    super();
    this.character = character;
    this.actor = actor;
    this._actorQuestData = null;
    this._currentStage = null;
    this._stageIndex = -1;
    this._currentState = QuestState.STAGE_STATE.NOT_STARTED;
  }

  /**
   * The current stage of the quest that this state is on
   *
   * @returns {Number}
   */
  get stageIndex() {
    return this._stageIndex;
  }

  _setState(newState) {
    log.debug({ questOldState: this._currentState, questNewState: newState }, 'Quest stage changing state');
    this._currentState = newState;
  }

  set actorQuestData(data) {
    this._actorQuestData = data;
  }

  get actorQuestData() {
    return this._actorQuestData;
  }

  /**
   * Set the stage of the quest to begin
   *
   * @param {QuestStage} stage - The stage of the quest to begin
   * @param {Number}     index - The index of the quest stage
   */
  setStage(stage, index) {
    this._currentStage = stage;
    this._stageIndex = index;
    this._currentState = QuestState.STAGE_STATE.NOT_STARTED;
  }

  /**
   * Set the stage to be pending completion. This means all the criteria has been
   * met, save for actually going to the quest giver and completing the stage of the
   * quest.
   *
   * @returns {Boolean} True if we moved to pending completion
   */
  pendingCompleteStage() {
    if (this._currentState !== QuestState.STAGE_STATE.IN_PROGRESS) {
      log.debug({ questOldState: this._currentState, characterId: this.character.id, actorId: this.actor.id },
        'Attempt to move to pending complete when stage is not in progress');
      return false;
    }
    this._setState(QuestState.STAGE_STATE.PENDING_COMPLETE);
    return true;
  }

  /**
   * Complete the current quest stage
   *
   * @returns {Boolean} True if we completed the current stage
   */
  completeStage() {
    if (this._currentState !== QuestState.STAGE_STATE.PENDING_COMPLETE) {
      log.debug({ questOldState: this._currentState, characterId: this.character.id, actorId: this.actor.id },
        'Attempt to complete stage not in pending');
      return false;
    }
    this._currentStage.complete(this.character, this.actor, this);
    this._setState(QuestState.STAGE_STATE.COMPLETE);
    return true;
  }

  /**
   * Have the character accept this quest
   */
  accept() {
    if (this._currentState !== QuestState.STAGE_STATE.NOT_STARTED) {
      return;
    }
    this._actorQuestData = {};
    this._currentStage.accept(this.character, this.actor, this);
    this._setState(QuestState.STAGE_STATE.IN_PROGRESS);
  }

  /**
   * Check the status of the quest
   */
  checkStatus() {
    if (!this._currentStage) {
      return;
    }
    this._currentStage.checkStatus(this.character, this.actor, this);
  }
}

export default QuestState;
