//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import BaseClass from './BaseClass.js';

/**
 * @module game/classes/Fighter
 */

class Fighter extends BaseClass {

  /**
   * Create a new fighter class
   */
  constructor(character) {
    super(character);

    this.hitDice = 12;
    this.energyDice = 12;
    this.manaDice = 0;

    this.setLevel();
  }

  /**
   * The underlying class type
   */
  get characterType() {
    return 'fighter';
  }

  /**
   * A character's mana points bonus
   *
   * @returns {Number}
   */
  get manapointBonus() {
    return 0;
  }

  /**
   * Set the level properties on the character
   */
  setLevel() {
    super.setLevel();

    switch(this.level) {
    case 1:
      super.setBaseSkill('attack');
      super.setBaseSkill('piercing');
      super.setBaseSkill('slashing');
      super.setBaseSkill('bludgeoning');
      super.setBaseSkill('defense');
      super.setBaseSkill('shields');
      super.setBaseSkill('armor');
      break;
    case 3:
      super.setBaseSkill('kick');
      break;
    case 4:
      super.setBaseSkill('double attack');
      break;
    case 5:
      super.setBaseSkill('shield bash');
      super.setBaseSkill('parry');
      break;
    case 7:
      super.setBaseSkill('body slam');
      super.setBaseSkill('shield party');
      break;
    case 9:
      super.setBaseSkill('cleave');
      break;
    case 10:
      super.setBaseSkill('triple attack');
      break;
    default:
      break;
    }
  }

  /**
   * Max out the skills of a character based on their level
   */
  setMaxSkills() {
    [
      'attack', 'piercing', 'slashing', 'bludgeoning', 'defense', 'shields', 'armor',
      'kick', 'double attack', 'shield bash', 'parry', 'body slam', 'shield party',
      'cleave', 'triple attack'
    ].forEach((skill) => {
      if (this.character.skills.has(skill)) {
        this.character.skills.set(skill, this.level * 5);
      }
    });
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
    this.character.sendImmediate(this.toCharacterDetailsMessage());
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

export default Fighter;