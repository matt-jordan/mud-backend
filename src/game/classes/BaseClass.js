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
   * Add experience to this class
   *
   * @param {Number} encounterLevel - The level of the encounter that the character completed
   *
   * @returns {Boolean} True if the character gained a level
   */
  addExperience(encounterLevel) {
    // TODO: Come back and modify this when we have a party
    const delta = this.level - encounterLevel;

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

    this.experience += exp;
    this.character.sendImmediate(`You gain ${exp} experience in ${this.characterType}`);
    if (this.level < BaseClass.MAX_LEVEL && this.experience > BaseClass.characterLevels[this.level + 1]) {
      // DING
      this.level += 1;
      this.character.sendImmediate(`*DING* You have gained a level in ${this.characterType}! (Level ${this.level})`);
      return true;
    }

    return false;
  }

  /**
   * Convert this class to JSON
   *
   * @return {Object}
   */
  toJson() {
    const maxExperience = this.level === BaseClass.MAX_LEVEL ? '-' : BaseClass.characterLevels[this.level + 1];
    return {
      level: this.level,
      experience: this.experience,
      maxExperience,
    };
  }
}

export default BaseClass;
