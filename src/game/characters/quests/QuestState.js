//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

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
class QuestState {
  #actorQuestData;
  #currentStage;
  #stageIndex;
  #currentState;



  /**
   * Convert @see STAGE_STATE to a string
   * @static
   *
   * @param {QuestState.STAGE_STATE} stageState - The state of the stage
   *
   * @returns {String}
   */
  static stateToString(stageState) {
    switch (stageState) {
    case QuestState.STAGE_STATE.NOT_STARTED:
      return 'Not Started';
    case QuestState.STAGE_STATE.IN_PROGRESS:
      return 'In Progress';
    case QuestState.STAGE_STATE.PENDING_COMPLETE:
    case QuestState.STAGE_STATE.COMPLETE:
      return 'Complete';
    default:
      return 'Unknown';
    }
  }

  /**
   * @enum The specific states of the quest
   * @static
   * @returns {Number}
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
   * @param {String}    actorId   - The ID of the actor taking the quest
   */
  constructor(character, actorId) {
    this.character = character;
    this.actorId = actorId;
    this.#actorQuestData = null;
    this.#currentStage = null;
    this.#stageIndex = -1;
    this.#currentState = QuestState.STAGE_STATE.NOT_STARTED;
  }

  /**
   * The current stage of the quest that this state is on
   *
   * @returns {Number}
   */
  get stageIndex() {
    return this.#stageIndex;
  }

  /**
   * The current state of the quest stage
   *
   * @returns {QuestState.STAGE_STATE}
   */
  get stageState() {
    return this.#currentState;
  }

  /**
   * Set the current quest stage state
   * @private
   * @param {QuestState.STAGE_STATE} newStageState - The new quest stage state
   */
  #setStageState(newStageState) {
    log.debug({ questOldStageState: this.#currentState, questNewStageState: newStageState },
      'Quest stage changing state');
    this.#currentState = newStageState;
  }

  /**
   * Accessor to set quest data specific to the actor from the current stage
   *
   * @param {Object} data - Data to store from the current stage on the quest state
   */
  set actorQuestData(data) {
    this.#actorQuestData = data;
  }

  /**
   * Accessor to get quest data specific to the actor from the current stage
   *
   * @returns {Object}
   */
  get actorQuestData() {
    return this.#actorQuestData;
  }

  /**
   * Set the stage of the quest to begin
   *
   * @param {QuestStage}             stage                - The stage of the quest to begin
   * @param {Number}                 index                - The index of the quest stage
   * @param {QuestState.STAGE_STATE} [stageStateOverride] - Optional state to start at.
   *                                                        Should not be used unless on load.
   */
  setStage(stage, index, stageStateOverride = QuestState.STAGE_STATE.NOT_STARTED) {
    this.#currentStage = stage;
    this.#stageIndex = index;
    this.#currentState = stageStateOverride;
  }

  /**
   * Set the stage to be pending completion. This means all the criteria has been
   * met, save for actually going to the quest giver and completing the stage of the
   * quest.
   *
   * @returns {Boolean} True if we moved to pending completion
   */
  pendingCompleteStage() {
    if (this.#currentState !== QuestState.STAGE_STATE.IN_PROGRESS) {
      log.debug({ questOldState: this.#currentState, characterId: this.character.id, actorId: this.actorId },
        'Attempt to move to pending complete when stage is not in progress');
      return false;
    }
    this.#setStageState(QuestState.STAGE_STATE.PENDING_COMPLETE);
    return true;
  }

  /**
   * Complete the current quest stage
   *
   * @returns {Boolean} True if we completed the current stage
   */
  completeStage() {
    if (this.#currentState !== QuestState.STAGE_STATE.PENDING_COMPLETE
      && this.#currentState !== QuestState.STAGE_STATE.COMPLETE) {
      log.debug({ questOldState: this.#currentState, characterId: this.character.id, actorId: this.actorId },
        'Attempt to complete stage not in pending');
      return false;
    }
    this.#currentStage.complete(this.character, this.actorId, this);
    this.#setStageState(QuestState.STAGE_STATE.COMPLETE);
    return true;
  }

  /**
   * Have the character accept this quest
   */
  accept() {
    if (this.#currentState !== QuestState.STAGE_STATE.NOT_STARTED) {
      return;
    }
    this.#actorQuestData = {};
    this.#currentStage.accept(this.character, this.actorId, this);
    this.#setStageState(QuestState.STAGE_STATE.IN_PROGRESS);
  }

  /**
   * Check the status of the quest
   */
  checkStatus() {
    if (!this.#currentStage) {
      return;
    }
    this.#currentStage.checkStatus(this.character, this.actorId, this);
  }

  /**
   * Load the actor into the quest
   *
   * @param {Character} actor - the actor to load
   *
   * @see Quest.loadCharacter
   */
  loadCharacter(actor) {
    this.#currentStage.loadCharacter(actor, this);
  }

  /**
   * Convert the quest state to JSON, suitable for storage
   *
   * @returns {Object}
   */
  toJson() {
    return {
      characterId: this.actorId,
      activeStageIndex: this.#stageIndex,
      activeStageState: this.#currentState,
      activeStageData: { ...this.#actorQuestData },
    };
  }

  /**
   * Convert the quest state to text
   *
   * @returns {String}
   */
  toText() {
    return `[${QuestState.stateToString(this.#currentState)}]: ${this.#currentStage.toText(this)}`;
  }
}

export default QuestState;
