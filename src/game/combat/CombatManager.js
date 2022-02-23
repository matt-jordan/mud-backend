//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import Character from '../characters/Character.js';
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
    const combatRound = [];

    Object.keys(this._combats).forEach((attackerName) => {
      const combat = this._combats[attackerName];

      combatRound.push([combat, this._getInitiativeRoll(combat.attacker)]);
    });
    combatRound.sort((a, b) => b[1] - a[1]);

    combatRound.forEach((round) => {
      const [combat, initiative] = round;
      const attacker = combat.attacker;
      const defender = combat.defender;

      attacker.currentState = Character.STATE.FIGHTING;
      defender.currentState = Character.STATE.FIGHTING;

      log.debug({ attackerId: attacker.id, defenderId: defender.id, initiative }, 'Processing combat round');
      const result = combat.processRound();

      let deadCharacter;
      let otherCharacter;
      if (result === Combat.RESULT.DEFENDER_DEAD) {
        log.debug({ defenderId: defender.id }, 'Defender died; removing remaining combats');
        deadCharacter = defender;
        otherCharacter = attacker;
      } else if (result === Combat.RESULT.ATTACKER_DEAD) {
        log.debug({ attackerId: attacker.id }, 'Attacker died, removing remaining combats');
        deadCharacter = attacker;
        otherCharacter = defender;
      }

      if (deadCharacter) {
        if (deadCharacter in this._combats) {
          const combatToRemove = this._combats[deadCharacter.name];
          log.debug({ attackerId: combatToRemove.attacker.id, defenderId: combatToRemove.defender.id }, 'Removing combat');
          delete this._combats[deadCharacter.name];
        }
        const combats = Object.keys(this._combats)
          .map((attackerName) => this._combats[attackerName])
          .filter(otherCombat => otherCombat.attacker === deadCharacter || otherCombat.defender === deadCharacter);
        combats.forEach((otherCombat) => {
          const combatToRemove = this._combats[otherCombat.attacker.name];
          log.debug({ attackerId: combatToRemove.attacker.id, defenderId: combatToRemove.defender.id }, 'Removing combat');
          delete this._combats[otherCombat.attacker.name];
        });
      }

      // See if the other character needs to stop fighting
      if (otherCharacter) {
        if (this.checkCombat(otherCharacter)) {
          log.debug({ characterId: otherCharacter.id }, 'Character is still fighting');
        } else {
          log.debug({ characterId: otherCharacter.id }, 'Character is no longer in combat');
          otherCharacter.currentState = Character.STATE.NORMAL;
        }
      }
    });
  }

}

export default CombatManager;