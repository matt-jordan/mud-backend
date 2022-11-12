//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import Character from '../characters/Character.js';
import asyncForEach from '../../lib/asyncForEach.js';
import log from '../../lib/log.js';
import DiceBag from '../../lib/DiceBag.js';
import Combat from './Combat.js';
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
        this.diceBag = new DiceBag(1, 20, 8);
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
        this._combats[attacker.name] = new Combat(attacker, defender);
        attacker.currentState = Character.STATE.FIGHTING;
        defender.currentState = Character.STATE.FIGHTING;
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
    onTick() {
        return __awaiter(this, void 0, void 0, function* () {
            const combatRound = [];
            Object.keys(this._combats).forEach((attackerName) => {
                const combat = this._combats[attackerName];
                combatRound.push([combat, this._getInitiativeRoll(combat.attacker)]);
            });
            combatRound.sort((a, b) => b[1] - a[1]);
            yield asyncForEach(combatRound, (round) => __awaiter(this, void 0, void 0, function* () {
                const [combat, initiative] = round;
                const attacker = combat.attacker;
                const defender = combat.defender;
                if (attacker.currentState !== Character.STATE.DEAD) {
                    attacker.currentState = Character.STATE.FIGHTING;
                }
                if (defender.currentState !== Character.STATE.DEAD) {
                    defender.currentState = Character.STATE.FIGHTING;
                }
                const existingCombat = this.getCombat(defender);
                if (!existingCombat) {
                    // Defender is fighting and they don't know it; make a combat for them
                    log.debug({ attackerId: attacker.id, defenderId: defender.id }, 'Attacker attacked defender when they had no combat; creating new combat for them');
                    this.addCombat(defender, attacker);
                }
                log.debug({ attackerId: attacker.id, defenderId: defender.id, initiative }, 'Processing combat round');
                const result = combat.processRound();
                let deadCharacter;
                let otherCharacters = [];
                if (result === Combat.RESULT.DEFENDER_DEAD) {
                    log.debug({ defenderId: defender.id }, 'Defender died; removing remaining combats');
                    deadCharacter = defender;
                    otherCharacters.push(attacker);
                }
                else if (result === Combat.RESULT.ATTACKER_DEAD) {
                    log.debug({ attackerId: attacker.id }, 'Attacker died, removing remaining combats');
                    deadCharacter = attacker;
                    otherCharacters.push(defender);
                }
                if (deadCharacter) {
                    if (deadCharacter in this._combats) {
                        const combatToRemove = this._combats[deadCharacter.name];
                        log.debug({ attackerId: combatToRemove.attacker.id, defenderId: combatToRemove.defender.id }, 'Removing combat');
                        delete this._combats[deadCharacter.name];
                    }
                    const combats = Object.keys(this._combats)
                        .map((attackerName) => this._combats[attackerName])
                        .filter(otherCombat => (otherCombat.attacker === deadCharacter || otherCombat.defender === deadCharacter));
                    combats.forEach((otherCombat) => {
                        const combatToRemove = this._combats[otherCombat.attacker.name];
                        otherCharacters.push(deadCharacter === combatToRemove.attacker ? combatToRemove.defender : combatToRemove.attacker);
                        log.debug({ attackerId: combatToRemove.attacker.id, defenderId: combatToRemove.defender.id }, 'Removing combat');
                        delete this._combats[otherCombat.attacker.name];
                    });
                }
                // See if the other character needs to stop fighting
                otherCharacters = [...new Set(otherCharacters)];
                yield asyncForEach(otherCharacters, (otherCharacter) => __awaiter(this, void 0, void 0, function* () {
                    if (this.checkCombat(otherCharacter)) {
                        log.debug({ characterId: otherCharacter.id }, 'Character is still fighting');
                    }
                    else {
                        const combat = this.getCombat(otherCharacter);
                        if (!combat) {
                            log.debug({ characterId: otherCharacter.id }, 'Character is no longer in combat');
                            otherCharacter.currentState = Character.STATE.NORMAL;
                        }
                    }
                    // Award them their faction adjustment
                    if (deadCharacter) {
                        yield otherCharacter.factions.processKill(deadCharacter);
                    }
                }));
            }));
        });
    }
}
export default CombatManager;
