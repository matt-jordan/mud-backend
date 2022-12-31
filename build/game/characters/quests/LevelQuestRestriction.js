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
 * @module game/characters/quests/LevelQuestRestriction
 */
/**
 * Exercise restrictions for quests based on level
 */
class LevelQuestRestriction {
    /**
     * Create a new level restriction
     */
    constructor(model) {
        this.model = model;
    }
    /**
     * Perform a check on the character
     *
     * @param {Character} character - The character to check
     */
    check(character) {
        const { minLevel = 1, maxLevel = 10 } = this.model.data;
        const level = character.getLevel();
        return (level >= minLevel && level <= maxLevel);
    }
}
exports.default = LevelQuestRestriction;
