//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import Party from '../../characters/party/Party.js';
import log from '../../../lib/log.js';


/**
 * @module game/effects/priest/PrayerOfFire
 */

/**
 * A prayer that converts mana to energy.
 */
class PrayerOfFire {
  #character;
  #chantSkill;
  #prayerSkill;

  static #BASE_ENERGY_REGEN = 5;
  static #BASE_MANA_COST = 8;

  /**
   * The name of the prayer
   *
   * @returns {String}
   */
  static get name() {
    return 'prayer of healing';
  }

  /**
   * Create a new healing prayer effect
   *
   * @param {Character} character - the character who is doing the chanting
   */
  constructor({ character, chantSkill, prayerSkill }) {
    this.#character = character;
    this.#chantSkill = chantSkill;
    this.#prayerSkill = prayerSkill;
    this.tick = Number.MAX_SAFE_INTEGER; // Never expire. This will remove itself.
  }

  /**
   * The type of action (or effect?) this is
   *
   * @returns {String}
   */
  get actionType() {
    return 'prayer';
  }

  /**
   * The name of the prayer
   *
   * @returns {String}
   */
  get name() {
    return PrayerOfFire.name;
  }

  /**
   * Check if the player can perform the requested action
   *
   * @returns {Boolean} True if they can perform the action, false otherwise
   */
  checkAction() {
    return true;
  }

  /**
   * Called on each tick
   */
  onTick() {
    const manaCost = Math.max(PrayerOfFire.#BASE_MANA_COST - Math.floor(this.#chantSkill / 10), 1);
    const energyRegen = PrayerOfFire.#BASE_ENERGY_REGEN + Math.pow(2, Math.floor(this.#prayerSkill / 20));

    if (this.#character.attributes.manapoints.current - manaCost < 0) {
      log.debug({ manaCost, energyRegen, characterId: this.#character.id }, 'Character ran out of mana; expiring prayer of fire effect');
      this.tick = 0;
      return;
    }

    function apply(character) {
      let appliedEnergyRegen = energyRegen;
      if (character !== this.#character) {
        appliedEnergyRegen = Math.ceil(energyRegen * 1.5); // Bonus applied to party members
      }
      log.debug({ manaCost, appliedEnergyRegen, characterId: character.id }, 'Applying prayer of fire effect');
      character.attributes.energypoints.current = Math.min(
        character.attributes.energypoints.current + appliedEnergyRegen,
        character.attributes.energypoints.base);
      character.sendImmediate(character.toCharacterDetailsMessage());
    }

    // Pay the mana cost here, apply the energy to themselves or the party
    this.#character.attributes.manapoints.current = Math.max(
      this.#character.attributes.manapoints.current - manaCost,
      0);

    const party = Party.getParty(this.#character);
    if (!party) {
      apply.bind(this)(this.#character);
    } else {
      party.applyEffect(apply.bind(this));
    }
  }

  /**
   * Callback called when this action is first added to a character
   */
  onInitialPush() {
    const party = Party.getParty(this.#character);
    if (!party) {
      this.#character.sendImmediate('You are surrounded by a warming glow.');
    } else {
      party.applyEffect((character) => character.sendImmediate('You are surrounded by a warming glow.'));
    }
  }

  /**
   * Callback called when this action is no longer in effect on a character
   */
  onExpire() {
    const party = Party.getParty(this.#character);
    if (!party) {
      this.#character.sendImmediate('The warming glow fades from around you.');
    } else {
      party.applyEffect((character) => character.sendImmediate('The warming glow fades from around you.'));
    }
  }
}

export default PrayerOfFire;