//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import getRandomInteger from '../../lib/randomInteger.js';
import DiceBag from '../../lib/DiceBag.js';

const BASE_DEFENSE_SCORE = 10;

const sizeToNumber = {
  tiny: 0,
  small: 1,
  medium: 2,
  large: 3,
  giant: 4,
  collosal: 5,
};

/**
 * Class that performs combat between an attacker and their defender
 */
class Combat {

  /**
   * How the Combat round ended
   */
  static get RESULT() {
    return {
      ATTACKER_DEAD: 1,
      DEFENDER_DEAD: 2,
      CONTINUE: 3,
    };
  }

  /**
   * Create a new combat between an attacker and a defender
   *
   * @param {Character} attacker - The attacking character
   * @param {Character} defender - The defending character
   */
  constructor(attacker, defender) {
    this.attacker = attacker;
    this.defender = defender;
    this.nextRoll = 0;
    this.diceBag = new DiceBag(1, 20, 8);
  }

  /**
   * Set the next dice roll to some value
   *
   * @param {Number} roll - The next roll of the dice
   */
  setNextDiceRoll(roll) {
    this.nextRoll = roll;
  }

  /**
   * Calculate the hit bonus for the attacker
   * @private
   *
   * @returns {Number}
   */
  _calculateAttackerHitBonus() {
    const sizeBonus = (sizeToNumber[this.defender.size] - sizeToNumber[this.attacker.size]) * 2;
    const attributeBonus = this.attacker.getAttributeModifier('strength');

    return sizeBonus + attributeBonus;
  }

  /**
   * Calculate the defense bonus for the defender
   * @private
   *
   * @returns {Number}
   */
  _calculateDefenderDefenseBonus() {
    return this.defender.getAttributeModifier('dexterity');
  }

  /**
   * Calculdate how much damage the attacker does to the defender
   * @private
   *
   * @returns {Number}
   */
  _calculateAttackerDamage() {
    const strengthModifier = this.attacker.getAttributeModifier('strength');
    const min = Math.max(0, strengthModifier);
    const max = Math.max(1, strengthModifier + 1);

    return getRandomInteger(min, max);
  }

  /**
   * Process a round of combat between the attacker and defender
   *
   * @return {Combat.RESULT}
   */
  processRound() {
    if (this.attacker.attributes.hitpoints.current <= 0) {
      return Combat.RESULT.ATTACKER_DEAD;
    }
    if (this.defender.attributes.hitpoints.current <= 0) {
      return Combat.RESULT.DEFENDER_DEAD;
    }

    let roll;
    if (this.nextRoll > 0) {
      roll = this.nextRoll;
      this.nextRoll = 0;
    } else {
      roll = this.diceBag.getRoll();
    }

    if (roll + this._calculateAttackerHitBonus() <= BASE_DEFENSE_SCORE + this._calculateDefenderDefenseBonus()) {
      this.attacker.sendImmediate(`You try to hit ${this.defender.toShortText()} but miss!`);
      this.defender.sendImmediate(`${this.attacker.toShortText()} swings at you but misses!`);
      return Combat.RESULT.CONTINUE;
    }

    const damage = this._calculateAttackerDamage();
    this.defender.applyDamage(damage);
    this.attacker.sendImmediate(`You strike ${this.defender.toShortText()} for ${damage} points of damage!`);
    this.defender.sendImmediate(`${this.attacker.toShortText()} strikes you for ${damage} points of damage!`);

    if (this.defender.attributes.hitpoints.current === 0) {
      this.attacker.sendImmediate(`You have killed ${this.defender.toShortText()}`);
      return Combat.RESULT.DEFENDER_DEAD;
    }

    return Combat.RESULT.CONTINUE;
  }

}

export default Combat;