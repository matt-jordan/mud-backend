//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import BaseClass from './BaseClass.js';

/**
 * @module game/classes/Mage
 */

class Mage extends BaseClass {

  /**
   * Create a new fighter class
   */
  constructor(character) {
    super(character);

    this.setLevel();
  }

  /**
   * The underlying class type
   */
  get characterType() {
    return 'mage';
  }

  /**
   * Set the level properties on the character
   */
  setLevel() {
    switch(this.level) {
    case 1:
      if (!this.character.skills.has('piercing')) {
        this.character.skills.set('piercing', 1);
      }
      break;
    case 2:
      break;
    default:
      break;
    }
  }

  /**
   * Add experience to the character class
   *
   * @param {Number} encounterLevel - The level of the encounter completed
   *
   * @returns {Boolean} True if we gained a level, false otherwise
   */
  addExperience(encounterLevel) {
    const result = super.addExperience(encounterLevel);

    if (!result) {
      return result;
    }

    this.setLevel();

    return result;
  }

  /**
   * Convert this class to JSON
   *
   * @return {Object}
   */
  toJson() {
    const base = super.toJson();
    return {
      ...base,
      type: this.characterType,
    };
  }
}

export default Mage;