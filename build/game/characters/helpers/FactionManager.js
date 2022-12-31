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
const FactionModel_js_1 = __importDefault(require("../../../db/models/FactionModel.js"));
const asyncForEach_js_1 = __importDefault(require("../../../lib/asyncForEach.js"));
const log_js_1 = __importDefault(require("../../../lib/log.js"));
/**
 * @module game/characters/helpers/FactionManager
 */
/**
 * Manages the state of a faction for a character
 */
class FactionManager {
    /**
     * Convert a faction score into a friendly text description
     *
     * @param {Number} score - The current faction rating
     *
     * @returns {String}
     */
    static scoreToText(score) {
        if (score < 10) {
            return 'hated and loathed';
        }
        else if (score < 20) {
            return 'despised';
        }
        else if (score < 30) {
            return 'unloved';
        }
        else if (score < 50) {
            return 'neutral';
        }
        else if (score < 70) {
            return 'liked';
        }
        else if (score < 90) {
            return 'favored';
        }
        else {
            return 'loved';
        }
    }
    /**
     * Create a faction manager for a character
     *
     * @param {Character} character - The character to manage factions for
     */
    constructor(character) {
        this.character = character;
        this.factions = {};
    }
    /**
     * Adjust the faction standing for this character
     *
     * @param {String} name  - The name of the faction to adjust
     * @param {Number} score - The value to adjust the faction standing by
     */
    async adjustFaction(name, score) {
        let modifier = score + this.character.getAttributeModifier('charisma');
        if (score < 0 && modifier >= 0) {
            modifier = -1;
        }
        else if (score > 0 && modifier <= 0) {
            modifier = 1;
        }
        await this._adjustFaction(name, modifier);
    }
    /**
     * Get the score for a particular faction
     *
     * @param {String} name - The name of the faction to look up
     *
     * @returns {Number} -1 if the faction is unknown; integer otherwise
     */
    factionScore(name) {
        if (!(name in this.factions)) {
            return -1;
        }
        return this.factions[name].score;
    }
    /**
     * Initialize the faction score to a set value
     *
     * If the Character has the faction already, this does nothing.
     *
     * @param {String} name  - The name of the faction to adjust
     * @param {Number} score - The score they should have
     */
    async initializeFaction(name, score) {
        await this._adjustFaction(name, 0, score);
    }
    /**
     * Internal function used for adjusting faction
     * @internal
     * @param {String} name           - The name of the faction to adjust
     * @param {Number} score          - The value to adjust the faction standing by
     * @param {Number} [initialValue] - Optional. If provided, what we should set
     *                                  the score to if this is the first time we've
     *                                  seen the faction.
     */
    async _adjustFaction(name, score, initialValue = 0) {
        if (!(name in this.factions)) {
            const factionModel = await FactionModel_js_1.default.findOne({ name });
            if (!factionModel) {
                log_js_1.default.warn({ characterId: this.character.id }, `Unable to find faction ${name}`);
                return;
            }
            this.factions[name] = {
                score: initialValue || factionModel.startingValue,
                model: factionModel,
            };
        }
        if (score === 0) {
            return;
        }
        if (this.factions[name].score + score > 100) {
            this.factions[name].score = 100;
            log_js_1.default.debug({
                characterId: this.character.id,
                factionName: name,
                factionScore: this.factions[name].score,
                score,
            }, 'Setting score to 100; it cannot get better');
        }
        else if (this.factions[name].score + score < 0) {
            this.factions[name].score = 0;
            log_js_1.default.debug({
                characterId: this.character.id,
                factionName: name,
                factionScore: this.factions[name].score,
                score,
            }, 'Setting score to 0; it cannot get worse');
        }
        else {
            this.factions[name].score += score;
            log_js_1.default.debug({
                characterId: this.character.id,
                factionName: name,
                factionScore: this.factions[name].score,
                score,
            }, 'Adjusting faction score');
        }
        this.character.sendImmediate(`Your standing with ${name} has ${score > 0 ? 'improved' : 'worsened'} [${this.factions[name].score}]`);
    }
    /**
     * Get all the faction scores for this character
     *
     * @returns {Array} A list of Objects of faction names/scores
     */
    factionScores() {
        return Object.values(this.factions).map((value) => {
            return {
                name: value.model.name,
                score: value.score,
                positiveModifier: value.model.positiveModifier,
                negativeModifier: value.model.negativeModifier,
            };
        });
    }
    /**
     * Handle this character's faction adjustments as a result of killing a character
     *
     * @param {Character} deadCharacter - The character who we just killed
     */
    async processKill(deadCharacter) {
        await (0, asyncForEach_js_1.default)(deadCharacter.factions.factionScores(), async (faction) => {
            const { name, score, negativeModifier, positiveModifier } = faction;
            const charismaBonus = this.character.getAttributeModifier('charisma');
            // Three modifiers (so far):
            //  Convert their faction status to a value between 4 (0) and -6 (100)
            //  Add the charisma bonus -4 (2) to 4 (18)
            //  Add the faction's base modifier - if the character was poorly aligned
            //    add the positive modifier; if the character was well aligned negative
            //    modifier
            let modifier = (Math.ceil((score - 40) / 10) * -1)
                + charismaBonus
                + (score > 40 ? negativeModifier * -1 : positiveModifier);
            // No matter what, make sure we modify it in some way
            if (modifier <= 0 && score < 40) {
                modifier = 1;
            }
            else if (modifier >= 0 && score > 40) {
                modifier = -1;
            }
            await this._adjustFaction(name, modifier);
        });
    }
}
exports.default = FactionManager;
