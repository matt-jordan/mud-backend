//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _QuestState_instances, _QuestState_actorQuestData, _QuestState_currentStage, _QuestState_stageIndex, _QuestState_currentState, _QuestState_setStageState;
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
    /**
     * Create a new quest state
     *
     * @param {Character} character - The character who owns the quest
     * @param {String}    actorId   - The ID of the actor taking the quest
     */
    constructor(character, actorId) {
        _QuestState_instances.add(this);
        _QuestState_actorQuestData.set(this, void 0);
        _QuestState_currentStage.set(this, void 0);
        _QuestState_stageIndex.set(this, void 0);
        _QuestState_currentState.set(this, void 0);
        this.character = character;
        this.actorId = actorId;
        __classPrivateFieldSet(this, _QuestState_actorQuestData, null, "f");
        __classPrivateFieldSet(this, _QuestState_currentStage, null, "f");
        __classPrivateFieldSet(this, _QuestState_stageIndex, -1, "f");
        __classPrivateFieldSet(this, _QuestState_currentState, QuestState.STAGE_STATE.NOT_STARTED, "f");
    }
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
     * The current stage of the quest that this state is on
     *
     * @returns {Number}
     */
    get stageIndex() {
        return __classPrivateFieldGet(this, _QuestState_stageIndex, "f");
    }
    /**
     * The current state of the quest stage
     *
     * @returns {QuestState.STAGE_STATE}
     */
    get stageState() {
        return __classPrivateFieldGet(this, _QuestState_currentState, "f");
    }
    /**
     * Accessor to set quest data specific to the actor from the current stage
     *
     * @param {Object} data - Data to store from the current stage on the quest state
     */
    set actorQuestData(data) {
        __classPrivateFieldSet(this, _QuestState_actorQuestData, data, "f");
    }
    /**
     * Accessor to get quest data specific to the actor from the current stage
     *
     * @returns {Object}
     */
    get actorQuestData() {
        return __classPrivateFieldGet(this, _QuestState_actorQuestData, "f");
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
        __classPrivateFieldSet(this, _QuestState_currentStage, stage, "f");
        __classPrivateFieldSet(this, _QuestState_stageIndex, index, "f");
        __classPrivateFieldSet(this, _QuestState_currentState, stageStateOverride, "f");
    }
    /**
     * Set the stage to be pending completion. This means all the criteria has been
     * met, save for actually going to the quest giver and completing the stage of the
     * quest.
     *
     * @returns {Boolean} True if we moved to pending completion
     */
    pendingCompleteStage() {
        if (__classPrivateFieldGet(this, _QuestState_currentState, "f") !== QuestState.STAGE_STATE.IN_PROGRESS) {
            log.debug({ questOldState: __classPrivateFieldGet(this, _QuestState_currentState, "f"), characterId: this.character.id, actorId: this.actorId }, 'Attempt to move to pending complete when stage is not in progress');
            return false;
        }
        __classPrivateFieldGet(this, _QuestState_instances, "m", _QuestState_setStageState).call(this, QuestState.STAGE_STATE.PENDING_COMPLETE);
        return true;
    }
    /**
     * Complete the current quest stage
     *
     * @returns {Boolean} True if we completed the current stage
     */
    completeStage() {
        if (__classPrivateFieldGet(this, _QuestState_currentState, "f") !== QuestState.STAGE_STATE.PENDING_COMPLETE
            && __classPrivateFieldGet(this, _QuestState_currentState, "f") !== QuestState.STAGE_STATE.COMPLETE) {
            log.debug({ questOldState: __classPrivateFieldGet(this, _QuestState_currentState, "f"), characterId: this.character.id, actorId: this.actorId }, 'Attempt to complete stage not in pending');
            return false;
        }
        __classPrivateFieldGet(this, _QuestState_currentStage, "f").complete(this.character, this.actorId, this);
        __classPrivateFieldGet(this, _QuestState_instances, "m", _QuestState_setStageState).call(this, QuestState.STAGE_STATE.COMPLETE);
        return true;
    }
    /**
     * Have the character accept this quest
     */
    accept() {
        if (__classPrivateFieldGet(this, _QuestState_currentState, "f") !== QuestState.STAGE_STATE.NOT_STARTED) {
            return;
        }
        __classPrivateFieldSet(this, _QuestState_actorQuestData, {}, "f");
        __classPrivateFieldGet(this, _QuestState_currentStage, "f").accept(this.character, this.actorId, this);
        __classPrivateFieldGet(this, _QuestState_instances, "m", _QuestState_setStageState).call(this, QuestState.STAGE_STATE.IN_PROGRESS);
    }
    /**
     * Check the status of the quest
     */
    checkStatus() {
        if (!__classPrivateFieldGet(this, _QuestState_currentStage, "f")) {
            return;
        }
        __classPrivateFieldGet(this, _QuestState_currentStage, "f").checkStatus(this.character, this.actorId, this);
    }
    /**
     * Load the actor into the quest
     *
     * @param {Character} actor - the actor to load
     *
     * @see Quest.loadCharacter
     */
    loadCharacter(actor) {
        __classPrivateFieldGet(this, _QuestState_currentStage, "f").loadCharacter(actor, this);
    }
    /**
     * Convert the quest state to JSON, suitable for storage
     *
     * @returns {Object}
     */
    toJson() {
        return {
            characterId: this.actorId,
            activeStageIndex: __classPrivateFieldGet(this, _QuestState_stageIndex, "f"),
            activeStageState: __classPrivateFieldGet(this, _QuestState_currentState, "f"),
            activeStageData: Object.assign({}, __classPrivateFieldGet(this, _QuestState_actorQuestData, "f")),
        };
    }
    /**
     * Convert the quest state to text
     *
     * @returns {String}
     */
    toText() {
        return `[${QuestState.stateToString(__classPrivateFieldGet(this, _QuestState_currentState, "f"))}]: ${__classPrivateFieldGet(this, _QuestState_currentStage, "f").toText(this)}`;
    }
}
_QuestState_actorQuestData = new WeakMap(), _QuestState_currentStage = new WeakMap(), _QuestState_stageIndex = new WeakMap(), _QuestState_currentState = new WeakMap(), _QuestState_instances = new WeakSet(), _QuestState_setStageState = function _QuestState_setStageState(newStageState) {
    log.debug({ questOldStageState: __classPrivateFieldGet(this, _QuestState_currentState, "f"), questNewStageState: newStageState }, 'Quest stage changing state');
    __classPrivateFieldSet(this, _QuestState_currentState, newStageState, "f");
};
export default QuestState;
