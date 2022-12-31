"use strict";
//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module game/characters/quests/FactionQuestReward
 */
class FactionQuestReward {
    /**
     * Create a new faction quest reward
     *
     * @param {Object} model
     * @param {String} model.rewardType = 'faction' - The type of reward
     * @param {Object} model.data
     * @param {String} model.data.faction           - The name of the faction
     * @param {Number} model.data.bonus             - The faction adjustment
     */
    constructor(model) {
        this.model = model;
    }
    /**
     * Issue the reward to the actor of the quest
     *
     * @param {Character}  character - The character who granted the quest
     * @param {Character}  actor     - The actor of the quest
     * @param {QuestState} state     - The quest state object (UNUSED)
     */
    reward(character, actor) {
        const { faction, bonus } = this.model.data;
        actor.factions.adjustFaction(faction, bonus);
    }
}
exports.default = FactionQuestReward;
