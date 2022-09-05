//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import getRandomInteger from '../../lib/randomInteger.js';
import DiceBag from '../../lib/DiceBag.js';
import log from '../../lib/log.js';

/**
 * @module game/combat/Combat
 */

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
    this._round = 0;
    this.diceBag = new DiceBag(1, 20, 8);
    this.hitLocationDiceBag = new DiceBag(1, 100, 2);
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
    const attackSkillBonus = Math.floor(this.attacker.getSkill('attack') / 10);

    let backstabBonus = 0;
    if (this._round === 0) {
      const backstab = this.attacker.getSkill('backstab');
      if (backstab) {
        backstabBonus = Math.floor(backstab / 10);
      }
    }

    return sizeBonus + attributeBonus + attackSkillBonus + backstabBonus;
  }

  /**
   * Calculate the defense bonus for the defender
   * @private
   *
   * @returns {Number}
   */
  _calculateDefenderDefenseBonus() {
    const dexBonus = this.defender.getAttributeModifier('dexterity');
    // Eventually apply the max dex bonus...
    const defenseSkillBonus = Math.floor(this.defender.getSkill('defense') / 10);

    return dexBonus + defenseSkillBonus;
  }

  /**
   * Calculdate how much damage the attacker does to the defender
   * @private
   *
   * @param {Number} hitRoll  - the roll to hit
   * @param {String} location - the location the attack struck
   * @param {Object} attack   - The plain Object with properties that describes the attack
   *
   * @returns {Number}
   */
  _calculateAttackerDamage(hitRoll, location, attack) {
    const strengthModifier = this.attacker.getAttributeModifier('strength');
    const min = Math.max(attack.minDamage, strengthModifier);
    const max = Math.max(attack.maxDamage, strengthModifier + 1);

    let damage = getRandomInteger(min, max);
    if (hitRoll >= attack.minCritical && hitRoll <= attack.maxCritical) {
      damage *= attack.criticalModifier;
    }

    if (this._round === 0) {
      const backstab = this.attacker.getSkill('backstab');
      if (backstab) {
        damage += ((Math.floor(backstab / 10) + 1) * 6);
      }
    }

    const armor = this.defender.physicalLocations[location].item;
    if (armor) {
      const armorSkillBonus = Math.floor(this.defender.getSkill('armor') / 10);
      damage = Math.max((damage - armor.model.armorClass - armorSkillBonus), 0);
    }

    log.debug({
      attackerId: this.attacker.id,
      defenderId: this.defender.id,
      damage,
      armorClass: armor ? `${armor.model.armorClass}` : 'none',
    }, `Attacker ${this.attacker.name} damage calculation against ${this.defender.name}`);

    return damage;
  }

  _determineHitLocation() {
    const sizeDifference = sizeToNumber[this.attacker.size] - sizeToNumber[this.defender.size];
    const hitLocationRoll = this.hitLocationDiceBag.getRoll();
    let location;

    if (sizeDifference <= -2) {
      if (hitLocationRoll <= 70) {
        location = 'feet';
      } else {
        location = 'legs';
      }
    } else if (sizeDifference === -1) {
      if (hitLocationRoll <= 40) {
        location = 'feet';
      } else if (hitLocationRoll <= 70) {
        location = 'legs';
      } else if (hitLocationRoll <= 82) {
        location = 'body';
      } else if (hitLocationRoll <= 94) {
        location = 'back';
      } else {
        location = 'hands';
      }
    } else if (sizeDifference === 0) {
      if (hitLocationRoll <= 5) {
        location = 'feet';
      } else if (hitLocationRoll <= 25) {
        location = 'legs';
      } else if (hitLocationRoll <= 60) {
        location = 'body';
      } else if (hitLocationRoll <= 70) {
        location = 'back';
      } else if (hitLocationRoll <= 80) {
        location = 'arms';
      } else if (hitLocationRoll <= 85) {
        location = 'hands';
      } else if (hitLocationRoll <= 90) {
        location = 'neck';
      } else {
        location = 'head';
      }
    } else if (sizeDifference === 1) {
      if (hitLocationRoll <= 1) {
        location = 'feet';
      } else if (hitLocationRoll <= 16) {
        location = 'legs';
      } else if (hitLocationRoll <= 56) {
        location = 'body';
      } else if (hitLocationRoll <= 71) {
        location = 'back';
      } else if (hitLocationRoll <= 81) {
        location = 'arms';
      } else if (hitLocationRoll <= 83) {
        location = 'hands';
      } else if (hitLocationRoll <= 88) {
        location = 'neck';
      } else {
        location = 'head';
      }
    } else { // sizeDifference >= 2
      if (hitLocationRoll <= 53) {
        location = 'body';
      } else if (hitLocationRoll <= 68) {
        location = 'back';
      } else if (hitLocationRoll <= 78) {
        location = 'arms';
      } else if (hitLocationRoll <= 80) {
        location = 'hands';
      } else if (hitLocationRoll <= 85) {
        location = 'neck';
      } else {
        location = 'head';
      }
    }

    return location || 'body';
  }

  combatMessage(message) {
    return {
      messageType: 'CombatMessage',
      message,
    };
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

    for (let i = 0; i < this.attacker.attacks.length; i += 1) {
      const attack = this.attacker.attacks[i];

      const hitLocation = this._determineHitLocation();
      log.debug({ round: this._round, attackerId: this.attacker.id, hitLocation },
        `${this.attacker.name} picks location`);

      let roll;
      if (this.nextRoll > 0) {
        roll = this.nextRoll;
        this.nextRoll = 0;
      } else {
        roll = this.diceBag.getRoll();
      }

      const attackRoll = roll + this._calculateAttackerHitBonus();
      const defenseCheck = BASE_DEFENSE_SCORE + this._calculateDefenderDefenseBonus();
      if (attackRoll <= defenseCheck) {
        log.debug({
          round: this._round,
          attackerId: this.attacker.id,
          defenderId: this.defender.id,
          hitLocation,
          attackRoll,
          defenseCheck,
        }, `Attacker ${this.attacker.name} misses defender ${this.defender.name}`);
        this.attacker.sendImmediate(this.combatMessage(`You try to ${attack.verbs.firstPerson} ${this.defender.toShortText()} in their ${hitLocation} ${attack.name ? `with your ${attack.name} ` : ''}but miss!`));
        this.defender.sendImmediate(this.combatMessage(`${this.attacker.toShortText()} ${attack.verbs.thirdPerson} at your ${hitLocation} ${attack.name ? `with their ${attack.name} ` : ''}but misses!`));
        this.attacker.room.sendImmediate([ this.attacker, this.defender, ],
          this.combatMessage(`${this.attacker.toShortText()} attempts to ${attack.verbs.firstPerson} ${this.defender.toShortText()} ${attack.name ? `with their ${attack.name} ` : ''}in their ${hitLocation} but misses!`));
        return Combat.RESULT.CONTINUE;
      }

      const damage = this._calculateAttackerDamage(roll, hitLocation, attack);
      this.defender.applyDamage(damage);

      log.debug({
        round: this._round,
        attackerId: this.attacker.id,
        defenderId: this.defender.id,
        hitLocation,
        attackRoll,
        defenseCheck,
        damage,
      }, `Attacker ${this.attacker.name} hits defender ${this.defender.name} for ${damage}`);

      this.attacker.sendImmediate(this.combatMessage(`You ${attack.verbs.firstPerson} ${this.defender.toShortText()} in their ${hitLocation} ${attack.name ? `with your ${attack.name} ` : ''}for ${damage} points of damage!`));
      this.defender.sendImmediate(this.combatMessage(`${this.attacker.toShortText()} ${attack.verbs.thirdPerson} you in your ${hitLocation} ${attack.name ? `with their ${attack.name} ` : ''}for ${damage} points of damage!`));
      this.attacker.room.sendImmediate([ this.attacker, this.defender, ],
        this.combatMessage(`${this.attacker.toShortText()} ${attack.verbs.thirdPerson} ${this.defender.toShortText()} ${attack.name ? `with their ${attack.name} ` : ''}in their ${hitLocation} for ${damage} points of damage!`));

      if (this.defender.attributes.hitpoints.current === 0) {
        log.debug({
          round: this._round,
          attackerId: this.attacker.id,
          defenderId: this.defender.id,
          hitLocation,
          attackRoll,
          defenseCheck,
          damage,
        }, `Attacker ${this.attacker.name} kills defender ${this.defender.name}`);

        this.attacker.addKill(this.defender);
        this.attacker.addExperience(this.defender.getLevel());
        this.attacker.sendImmediate(this.combatMessage(`You have killed ${this.defender.toShortText()}`));
        this.attacker.room.sendImmediate([ this.attacker, this.defender, ],
          this.combatMessage(`${this.attacker.toShortText()} has killed ${this.defender.toShortText()}`));
        return Combat.RESULT.DEFENDER_DEAD;
      }
    }

    this._round += 1;
    return Combat.RESULT.CONTINUE;
  }

}

export default Combat;