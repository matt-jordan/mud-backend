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
const Character_js_1 = __importDefault(require("../characters/Character.js"));
const asyncForEach_js_1 = __importDefault(require("../../lib/asyncForEach.js"));
const log_js_1 = __importDefault(require("../../lib/log.js"));
const DiceBag_js_1 = __importDefault(require("../../lib/DiceBag.js"));
const Combat_js_1 = __importDefault(require("./Combat.js"));
/**
 * @module game/combat/CombatManager
 */
/**
 * Manager for Combats
 */
class CombatManager {
    /**
     * Create a new combat manager
     */
    constructor() {
        this._combats = {};
        this.diceBag = new DiceBag_js_1.default(1, 20, 8);
    }
    /**
     * The number of combats happening
     *
     * @return {Number}
     */
    get combats() {
        return Object.keys(this._combats).length;
    }
    /**
     * Add a combat between an attacker and a defender
     *
     * @param {Character} attacker - The attacking character
     * @param {Character} defender - The defending character
     *
     * @returns {Combat} Object is the combat was created, null otherwise
     */
    addCombat(attacker, defender) {
        if (attacker.name in this._combats) {
            return null;
        }
        this._combats[attacker.name] = new Combat_js_1.default(attacker, defender);
        attacker.currentState = Character_js_1.default.STATE.FIGHTING;
        defender.currentState = Character_js_1.default.STATE.FIGHTING;
        return this._combats[attacker.name];
    }
    /**
     * Returns whether or not the character is currently in combat
     *
     * @param {Character} character - The attacking character
     *
     * @returns {Boolean}
     */
    checkCombat(character) {
        if (character.name in this._combats) {
            return true;
        }
        const combatList = Object.keys(this._combats)
            .map((attackerName) => this._combats[attackerName]);
        const match = combatList.find((combat) => combat.attacker === character || combat.defender === character);
        if (match) {
            return true;
        }
        return false;
    }
    /**
     * Get the combat associated with the attacking character
     *
     * @param {Character} attacker - The attacking character
     *
     * @returns {Combat} The combat or null
     */
    getCombat(attacker) {
        if (!(attacker.name in this._combats)) {
            return null;
        }
        return this._combats[attacker.name];
    }
    /**
     * Get the initiative roll for a character
     * @private
     *
     * @param {Character} character - The character to get initiative for
     *
     * @returns {Number}
     */
    _getInitiativeRoll(character) {
        const initiativeRoll = this.diceBag.getRoll() + character.getAttributeModifier('dexterity');
        return initiativeRoll;
    }
    /**
     * Process the combat
     */
    async onTick() {
        const combatRound = [];
        Object.keys(this._combats).forEach((attackerName) => {
            const combat = this._combats[attackerName];
            combatRound.push([combat, this._getInitiativeRoll(combat.attacker)]);
        });
        combatRound.sort((a, b) => b[1] - a[1]);
        await (0, asyncForEach_js_1.default)(combatRound, async (round) => {
            const [combat, initiative] = round;
            const attacker = combat.attacker;
            const defender = combat.defender;
            if (attacker.currentState !== Character_js_1.default.STATE.DEAD) {
                attacker.currentState = Character_js_1.default.STATE.FIGHTING;
            }
            if (defender.currentState !== Character_js_1.default.STATE.DEAD) {
                defender.currentState = Character_js_1.default.STATE.FIGHTING;
            }
            const existingCombat = this.getCombat(defender);
            if (!existingCombat) {
                // Defender is fighting and they don't know it; make a combat for them
                log_js_1.default.debug({ attackerId: attacker.id, defenderId: defender.id }, 'Attacker attacked defender when they had no combat; creating new combat for them');
                this.addCombat(defender, attacker);
            }
            log_js_1.default.debug({ attackerId: attacker.id, defenderId: defender.id, initiative }, 'Processing combat round');
            const result = combat.processRound();
            let deadCharacter;
            let otherCharacters = [];
            if (result === Combat_js_1.default.RESULT.DEFENDER_DEAD) {
                log_js_1.default.debug({ defenderId: defender.id }, 'Defender died; removing remaining combats');
                deadCharacter = defender;
                otherCharacters.push(attacker);
            }
            else if (result === Combat_js_1.default.RESULT.ATTACKER_DEAD) {
                log_js_1.default.debug({ attackerId: attacker.id }, 'Attacker died, removing remaining combats');
                deadCharacter = attacker;
                otherCharacters.push(defender);
            }
            if (deadCharacter) {
                if (deadCharacter in this._combats) {
                    const combatToRemove = this._combats[deadCharacter.name];
                    log_js_1.default.debug({ attackerId: combatToRemove.attacker.id, defenderId: combatToRemove.defender.id }, 'Removing combat');
                    delete this._combats[deadCharacter.name];
                }
                const combats = Object.keys(this._combats)
                    .map((attackerName) => this._combats[attackerName])
                    .filter(otherCombat => (otherCombat.attacker === deadCharacter || otherCombat.defender === deadCharacter));
                combats.forEach((otherCombat) => {
                    const combatToRemove = this._combats[otherCombat.attacker.name];
                    otherCharacters.push(deadCharacter === combatToRemove.attacker ? combatToRemove.defender : combatToRemove.attacker);
                    log_js_1.default.debug({ attackerId: combatToRemove.attacker.id, defenderId: combatToRemove.defender.id }, 'Removing combat');
                    delete this._combats[otherCombat.attacker.name];
                });
            }
            // See if the other character needs to stop fighting
            otherCharacters = [...new Set(otherCharacters)];
            await (0, asyncForEach_js_1.default)(otherCharacters, async (otherCharacter) => {
                if (this.checkCombat(otherCharacter)) {
                    log_js_1.default.debug({ characterId: otherCharacter.id }, 'Character is still fighting');
                }
                else {
                    const combat = this.getCombat(otherCharacter);
                    if (!combat) {
                        log_js_1.default.debug({ characterId: otherCharacter.id }, 'Character is no longer in combat');
                        otherCharacter.currentState = Character_js_1.default.STATE.NORMAL;
                    }
                }
                // Award them their faction adjustment
                if (deadCharacter) {
                    await otherCharacter.factions.processKill(deadCharacter);
                }
            });
        });
    }
}
exports.default = CombatManager;
