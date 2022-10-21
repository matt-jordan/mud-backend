//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import Character from '../characters/Character.js';
import Party from '../characters/Party.js';
import getRandomInteger from '../../lib/randomInteger.js';
import DiceBag from '../../lib/DiceBag.js';
import log from '../../lib/log.js';

/**
 * @module game/combat/Combat
 */

const BASE_DEFENSE_SCORE = 10;

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
    this.nextAttackRoll = 0;
    this._round = 0;
    this.diceBag = new DiceBag(1, 20, 8);
    this.hitLocationDiceBag = new DiceBag(1, 100, 2);
  }

  /**
   * Set the next dice roll to some value
   *
   * @param {Number} roll - The next roll of the dice
   */
  setNextAttackRoll(roll) {
    this.nextAttackRoll = roll;
  }

  /**
   * Set the next dic roll for blocking to some value
   *
   * @param {Number} roll - The next roll of the dice
   */
  setNextBlockRoll(roll) {
    this.nextBlockRoll = roll;
  }

  /**
   * Calculate the hit bonus for the attacker
   * @private
   *
   * @returns {Number}
   */
  _calculateAttackerHitBonus() {
    const sizeBonus = (Character.sizeToNumber(this.defender.size) - Character.sizeToNumber(this.attacker.size)) * 2;
    const attributeBonus = this.attacker.getAttributeModifier('strength');
    const attackSkillBonus = Math.floor(this.attacker.getSkill('attack') / 10);

    // NOTE: This may end up getting moved to the 'special' attack bonus
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
    const min = Math.max(attack.minDamage + strengthModifier, 0);
    const max = Math.max(attack.maxDamage + strengthModifier, 1);

    let damage = getRandomInteger(min, max);
    if (hitRoll >= attack.minCritical && hitRoll <= attack.maxCritical) {
      damage *= attack.criticalModifier;
    }

    // TODO: Move this to a special attack
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

  /**
   * Determine where the attacker is trying to hit
   *
   * @returns {String}
   */
  _determineHitLocation() {
    const sizeDifference = Character.sizeToNumber(this.attacker.size) - Character.sizeToNumber(this.defender.size);
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
      } else if (hitLocationRoll <= 90) {
        location = 'body';
      } else {
        location = 'hands';
      }
    } else if (sizeDifference === 0) {
      if (hitLocationRoll <= 5) {
        location = 'feet';
      } else if (hitLocationRoll <= 25) {
        location = 'legs';
      } else if (hitLocationRoll <= 70) {
        location = 'body';
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
      } else if (hitLocationRoll <= 65) {
        location = 'body';
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
      if (hitLocationRoll <= 72) {
        location = 'body';
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

  /**
   * Get the modifier we should apply when blocking a particular body location
   *
   * @param {String} hitLocation - The location being hit
   *
   * @returns {Number}
   */
  _locationBlockModifier(hitLocation) {
    switch (hitLocation) {
    case 'feet':
    case 'hands':
      return -4;
    case 'legs':
    case 'arms':
      return -2;
    case 'neck':
    case 'head':
      return 0;
    case 'body':
      return 2;
    default:
      return 0;
    }
  }

  /**
   * Get a defender's shield if they have one
   *
   * @returns {Object} shield or null
   */
  _getDefenderShield() {
    let shield;
    if (this.defender.physicalLocations.leftHand.item && this.defender.physicalLocations.leftHand.item.model.isShield) {
      shield = this.defender.physicalLocations.leftHand.item;
    } else if (this.defender.physicalLocations.rightHand.item && this.defender.physicalLocations.rightHand.item.model.isShield) {
      shield = this.defender.physicalLocations.rightHand.item;
    }
    return shield;
  }

  /**
   * Format the text message to a combat message
   *
   * @param {String} message - The message to send
   */
  combatMessage(message) {
    return {
      messageType: 'CombatMessage',
      message,
    };
  }

  /**
   * Get the next attack roll
   *
   * This is set up so that we can override the attack roll. Could be used by
   * certain skills, or to test things.
   */
  _getAttackRoll() {
    let roll;
    if (this.nextAttackRoll > 0) {
      roll = this.nextAttackRoll;
      this.nextAttackRoll = 0;
    } else {
      roll = this.diceBag.getRoll();
    }
    return roll;
  }

  /**
   * Get the next block roll
   *
   * This is set up so that we can override the block roll. Could be used by
   * certain skills, or to test things.
   */
  _getBlockRoll() {
    let roll;
    if (this.nextBlockRoll > 0) {
      roll = this.nextBlockRoll;
      this.nextBlockRoll = 0;
    } else {
      roll = this.diceBag.getRoll();
    }
    return roll;
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

    const attacks = this.attacker.attacks;
    for (let i = 0; i < attacks.length; i += 1) {
      const attack = attacks[i];

      const attackEnergyCost = attack.energyCost || 3;
      if (this.attacker.attributes.energypoints.current - attackEnergyCost <= 0) {
        this.attacker.sendImmediate(this.combatMessage(`You are too exhausted to attack${attack.name ? `with your ${attack.name} ` : ''}.`));
        continue;
      }
      this.attacker.attributes.energypoints.current -= attackEnergyCost;

      const hitLocation = this._determineHitLocation();
      log.debug({ round: this._round, attackerId: this.attacker.id, hitLocation },
        `${this.attacker.name} picks location`);

      const hitRoll = this._getAttackRoll();
      const attackRoll = hitRoll + this._calculateAttackerHitBonus() + (attack.hitBonus || 0);
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
        continue;
      }

      // Blocking
      const shield = this._getDefenderShield();
      if (shield) {
        const shieldBonus = Math.floor(this.defender.getSkill('shields') / 10);
        const blockRoll = this._getBlockRoll() + shieldBonus + this._locationBlockModifier(hitLocation);
        if (attackRoll <= blockRoll) {
          log.debug({
            round: this._round,
            attackerId: this.attacker.id,
            defenderId: this.defender.id,
            hitLocation,
            attackRoll,
            defenseCheck,
            blockRoll,
          }, `Attacker ${this.attacker.name} hits defender ${this.defender.name} but they block it with their ${shield.name}`);

          this.attacker.sendImmediate(this.combatMessage(`You try to ${attack.verbs.firstPerson} ${this.defender.toShortText()} in their ${hitLocation} ${attack.name ? `with your ${attack.name} ` : ''}but they block it with their ${shield.name}!`));
          this.defender.sendImmediate(this.combatMessage(`${this.attacker.toShortText()} tries to ${attack.verbs.firstPerson} you in your ${hitLocation} ${attack.name ? `with their ${attack.name} ` : ''}but you block it with your ${shield.name}!`));
          this.attacker.room.sendImmediate([ this.attacker, this.defender, ],
            this.combatMessage(`${this.attacker.toShortText()} attempts to ${attack.verbs.firstPerson} ${this.defender.toShortText()} ${attack.name ? `with their ${attack.name} ` : ''}in their ${hitLocation} but ${this.defender.toShortText()} blocks it with their ${shield.name}!`));
          continue;
        } else {
          log.debug({
            round: this._round,
            attackerId: this.attacker.id,
            defenderId: this.defender.id,
            hitLocation,
            attackRoll,
            defenseCheck,
            blockRoll,
          }, `Defender ${this.defender.name} fails to block attack from ${this.attacker.name} with their ${shield.name}`);
        }
      }

      const damage = this._calculateAttackerDamage(hitRoll, hitLocation, attack);
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
        this.combatMessage(`${this.attacker.toShortText()} ${attack.verbs.thirdPerson} ${this.defender.toShortText()} in their ${hitLocation} ${attack.name ? `with their ${attack.name} ` : ''}for ${damage} points of damage!`));

      attack.specialEffect?.(this);

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

        const party = Party.getParty(this.attacker);
        if (party) {
          party.addExperience(this.attacker, this.defender.getLevel());
        } else {
          this.attacker.addExperience(this.defender.getLevel());
        }
        this.attacker.addKill(this.defender);
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