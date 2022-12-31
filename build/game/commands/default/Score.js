"use strict";
//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoreFactory = exports.ScoreAction = void 0;
const characterDetails_js_1 = __importDefault(require("../../../game/characters/helpers/characterDetails.js"));
const FactionManager_js_1 = __importDefault(require("../../../game/characters/helpers/FactionManager.js"));
/**
 * @module game/commands/default/Score
 */
/**
 * Class the tells the player how they're doing in the game
 */
class ScoreAction {
    /**
     * Create a new action
     */
    constructor() {
    }
    execute(character) {
        let scoreText = (0, characterDetails_js_1.default)(character, character);
        const factionScores = character.factions.factionScores();
        if (factionScores.length > 0) {
            scoreText += 'You are ';
            scoreText += factionScores.map((fs) => {
                return `${FactionManager_js_1.default.scoreToText(fs.score)} [${fs.score}] by ${fs.name}`;
            }).join(', ');
            scoreText += '.\n';
        }
        scoreText += 'Quests completed:\n';
        if (character.questsCompleted.length > 0) {
            character.questsCompleted.forEach((quest) => {
                scoreText += ` - ${quest.name}: ${quest.count}\n`;
            });
        }
        else {
            scoreText += 'None.';
        }
        // Character details won't have the kills as it's also use for Examine; include
        // non-examine stuff here
        if (character.model.kills.length) {
            scoreText += 'Kills:\n';
            character.model.kills.forEach((kill) => {
                scoreText += ` - ${kill.count} ${kill.name}${kill.count > 1 ? 's' : ''}`;
                scoreText += `${kill.area ? ' in ' + kill.area : ''}\n`;
            });
        }
        character.sendImmediate(scoreText);
    }
}
exports.ScoreAction = ScoreAction;
/**
 * Class that creates ScoreAction objects
 */
class ScoreFactory {
    /**
     * The unique name that maps this factory to the player's command
     *
     * @return {String}
     */
    static get name() {
        return 'score';
    }
    /**
     * Create a new factory
     */
    constructor() {
    }
    /**
     * Generate a ScoreAction
     *
     * @returns {ScoreAction}
     */
    generate() {
        return new ScoreAction();
    }
}
exports.ScoreFactory = ScoreFactory;
