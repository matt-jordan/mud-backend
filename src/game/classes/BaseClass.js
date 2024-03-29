//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

/**
 * @module game/classes/BaseClass
 */

import DiceBag from '../../lib/DiceBag.js';

/**
 * A base class for character classes
 */
class BaseClass {

  /**
   * Max supported character level
   *
   * @return {Number}
   */
  static get MAX_LEVEL() {
    return 10;
  }

  /**
   * Returns the amount of experience you get for completing an encounter
   */
  static get encounterLevelToExp() {
    return {
      0: 0,
      1: 50,
      2: 100,
      3: 120,
      4: 160,
      5: 200,
      6: 280,
      7: 300,
      8: 325,
      9: 350,
    };
  }

  /**
   * Returns the amount of experience needed to achieve a level
   */
  static get characterLevels() {
    return {
      0: 0,
      1: 0,
      2: 1000,
      3: 3000,
      4: 6000,
      5: 10000,
      6: 15000,
      7: 22000,
      8: 31000,
      9: 42000,
      10: 55000,
      11: 100000000, // Need a max level
    };
  }

  /**
   * Create a new class
   */
  constructor(character) {
    this.experience = 0;
    this.level = 1;
    this.character = character;
  }

  /**
   * A character's hit point bonus
   *
   * @returns {Number}
   */
  get hitpointBonus() {
    return this.character.getAttributeModifier('constitution');
  }

  /**
   * A character's energy point bonus
   *
   * @returns {Number}
   */
  get energypointBonus() {
    return this.character.getAttributeModifier('constitution');
  }

  /**
   * Called when we have gained a level. This applies the 'level-up' bonuses based
   * on the current value of `this.level`.
   */
  setLevel() {
    if (this.level > 1) {
      if (this.hitDice) {
        const hitPointDice = new DiceBag(1, this.hitDice, 1);
        const hitPointRoll = hitPointDice.getRoll() || 0;
        const hitPointIncrease = hitPointRoll + this.hitpointBonus;
        this.character.attributes.hitpoints.base += hitPointIncrease;
        this.character.attributes.hitpoints.current += hitPointIncrease;
      }

      if (this.energyDice) {
        const energyPointDice = new DiceBag(1, this.energyDice, 1);
        const energyPointRoll = energyPointDice.getRoll() || 0;
        const energyPointIncrease = energyPointRoll + this.energypointBonus;
        this.character.attributes.energypoints.base += energyPointIncrease;
        this.character.attributes.energypoints.current += energyPointIncrease;
      }

      if (this.manaDice) {
        const manaPointDice = new DiceBag(1, this.manaDice, 1);
        const manaPointRoll = manaPointDice.getRoll() || 0;
        const manaPointIncrease = manaPointRoll + this.manapointBonus;
        this.character.attributes.manapoints.base += manaPointIncrease;
        this.character.attributes.manapoints.current += manaPointIncrease;
      }
    }
  }

  /**
   * Add experience to this class
   *
   * @param {Number} encounterLevel - The level of the encounter that the character completed
   * @param {Number} partySize      - Number of characters in the party
   *
   * @returns {Boolean} True if the character gained a level
   */
  addExperience(encounterLevel, partySize = 1) {
    const delta = this.level - encounterLevel;
    const partyBonus = (partySize - 1) * 0.1;

    let exp;
    if (delta <= -2) {
      exp = BaseClass.encounterLevelToExp[encounterLevel] * 4;
    } else if (delta <= -1) {
      exp = BaseClass.encounterLevelToExp[encounterLevel] * 2;
    } else if (delta === 0) {
      exp = BaseClass.encounterLevelToExp[encounterLevel];
    } else if (delta <= 1) {
      exp = Math.floor(BaseClass.encounterLevelToExp[encounterLevel] / 2);
    } else {
      exp = Math.floor(BaseClass.encounterLevelToExp[encounterLevel] / 4);
    }
    exp = Math.round(exp * (1 + partyBonus) / partySize);

    this.experience += exp;
    this.character.sendImmediate(`You gain ${exp} experience in ${this.characterType}`);
    if (this.level < BaseClass.MAX_LEVEL && this.experience > BaseClass.characterLevels[this.level + 1]) {
      // DING
      this.level += 1;
      this.character.sendImmediate(`*DING* You have gained a level in ${this.characterType}! (Level ${this.level})`);
      this.setLevel();
      this.character.sendImmediate(this.character.toCharacterDetailsMessage());
      return true;
    }

    return false;
  }

  /**
   * Set the base skill on a character to its starting value of 1
   *
   * @param {String} skill - The skill to safely set to 1
   */
  setBaseSkill(skill) {
    if (!this.character.skills.has(skill)) {
      this.character.skills.set(skill, 1);
    }
  }

  /**
   * Convert this class to JSON
   *
   * @return {Object}
   */
  toJson() {
    const maxExperience = this.level === BaseClass.MAX_LEVEL ? '-' : BaseClass.characterLevels[this.level + 1];
    return {
      type: this.characterType,
      level: this.level,
      experience: this.experience,
      maxExperience,
    };
  }
}

export default BaseClass;
