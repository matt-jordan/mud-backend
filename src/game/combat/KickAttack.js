//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import Character from '../characters/Character.js';
import DiceBag from '../../lib/DiceBag.js';
import log from '../../lib/log.js';

/**
 * A special attack where a character kicks another character
 */
class KickAttack {

  static BASE_ENERGY_COST = 25;

  static kickDice = new DiceBag(1, 20, 2);

  /**
   * Create a new kick attack
   *
   * @param {Character} character - the character performing the action
   */
  constructor(character, target) {
    this.character = character;
    this.target = target;
    this.kickSkill = this.character.getSkill('kick');
    this.tick = 0;
    this._maxDamage = 1; // Kick attacks use the character's strength
    this.minCritical = 0;
    this.maxCritical = 0;
    this.criticalModifier = 1;
  }

  /**
   * The type of queued action we're going to perform
   */
  get actionType() {
    return 'attack';
  }

  /**
   * The verbse associated with the action we're performing
   */
  get verbs() {
    return {
      firstPerson: 'kick',
      thirdPerson: 'kicks',
    };
  }

  /**
   * Minimum damage of the attack
   */
  get minDamage() {
    return 0;
  }

  /**
   * Maximum damage of the attack
   */
  get maxDamage() {
    return this._maxDamage;
  }

  get energyCost() {
    return KickAttack.BASE_ENERGY_COST - Math.floor(this.kickSkill / 10);
  }

  get hitBonus() {
    return Math.floor(this.kickSkill / 10);
  }

  /**
   * Checks if the provided character is allowed to do the action
   *
   * @note This will send messages to the character
   */
  canPerformAction() {
    if (!this.kickSkill) {
      this.character.sendImmediate('You do not know how to kick.');
      return false;
    }

    if (this.character.attackActions.length > 0) {
      this.character.sendImmediate('You are already about to perform a special attack.');
      return false;
    }

    if (this.character.attributes.energypoints.current - this.energyCost <= 0) {
      this.character.sendImmediate('You are too exhausted to kick.');
      return false;
    }

    return true;
  }

  /**
   * Called by the combat routine when the attack has landed.
   */
  specialEffect() {
    const sizeDifference = Character.sizeToNumber(this.character.size) - Character.sizeToNumber(this.target.size);
    const kickAttackResult = Math.max(1, KickAttack.kickDice.getRoll() + this.hitBonus + sizeDifference + this.character.getAttributeModifier('strength'));
    const kickDefenseResult = Math.max(1, KickAttack.kickDice.getRoll() + this.character.getAttributeModifier('dexterity'));

    log.debug({ kickAttackResult, kickDefenseResult, attackerId: this.character.id, defenderId: this.target.id }, 'Kick special attack result');
    if (kickAttackResult > kickDefenseResult) {

    }
  }
}


export default KickAttack;