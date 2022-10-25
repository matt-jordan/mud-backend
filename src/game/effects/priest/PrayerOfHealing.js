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
 * @module game/effects/priest/PrayerOfHealing
 */

/**
 * A healing prayer that converts mana to hp.
 */
class PrayerOfHealing {
  #character;
  #chantSkill;
  #prayerSkill;

  static #BASE_HP_REGEN = 1;
  static #BASE_MANA_COST = 6;

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
    return PrayerOfHealing.name;
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
    const manaCost = Math.max(PrayerOfHealing.#BASE_MANA_COST - Math.floor(this.#chantSkill / 10), 1);
    const hpRegen = PrayerOfHealing.#BASE_HP_REGEN + Math.pow(2, Math.floor(this.#prayerSkill / 20));

    if (this.#character.attributes.manapoints.current - manaCost < 0) {
      log.debug({ manaCost, hpRegen, characterId: this.#character.id }, 'Character ran out of mana; expiring prayer of healing effect');
      this.tick = 0;
      return;
    }

    function apply(character) {
      let appliedHpRegen = hpRegen;
      if (character !== this.#character) {
        appliedHpRegen = Math.ceil(hpRegen * 1.5); // Bonus applied to party members
      }
      log.debug({ manaCost, appliedHpRegen, characterId: character.id }, 'Applying prayer of healing effect');
      character.attributes.hitpoints.current = Math.min(
        character.attributes.hitpoints.current + appliedHpRegen,
        character.attributes.hitpoints.base);
      character.sendImmediate(character.toCharacterDetailsMessage());
    }

    // Pay the mana cost here, apply the HP to themselves or the party
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
      this.#character.sendImmediate('You are surrounded by a healing glow.');
    } else {
      party.applyEffect((character) => character.sendImmediate('You are surrounded by a healing glow.'));
    }
  }

  /**
   * Callback called when this action is no longer in effect on a character
   */
  onExpire() {
    const party = Party.getParty(this.#character);
    if (!party) {
      this.#character.sendImmediate('The healing glow fades from around you.');
    } else {
      party.applyEffect((character) => character.sendImmediate('The healing glow fades from around you.'));
    }
  }
}

export default PrayerOfHealing;