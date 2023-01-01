//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import { v4 as uuid } from 'uuid';

import log from '../../../lib/log.js';
import LightEffect from '../LightEffect.js';

/**
 * @module game/effects/priest/RecitationOfLight
 */

/**
 * A prayer that creates a light source for the player
 */
class RecitationOfLight {
  #character;
  #chantSkill;
  #prayerSkill;
  #id;

  static #BASE_MANA_COST = 8;

  /**
   * The name of the prayer
   *
   * @returns {String}
   */
  static get name() {
    return 'recitation of light';
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
    this.#id = uuid();
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
    return RecitationOfLight.name;
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
    const manaCost = Math.max(RecitationOfLight.#BASE_MANA_COST - Math.floor(this.#chantSkill / 10) - Math.floor(this.#prayerSkill / 10), 1);

    if (this.#character.attributes.manapoints.current - manaCost < 0) {
      log.debug({ manaCost, characterId: this.#character.id }, 'Character ran out of mana; expiring prayer of light effect');
      this.tick = 0;
      return;
    }

    // Pay the mana cost here
    this.#character.attributes.manapoints.current = Math.max(
      this.#character.attributes.manapoints.current - manaCost,
      0);
  }

  /**
   * Callback called when this action is first added to a character
   */
  onInitialPush() {
    this.#character.effects.push(new LightEffect({ character: this.#character, source: `${this.name}-${this.#id}` }));
    this.#character.sendImmediate('You are surrounded by a soft light.');
  }

  /**
   * Callback called when this action is no longer in effect on a character
   */
  onExpire() {
    this.#character.effects = this.#character.effects.filter(e => e.source !== `${this.name}-${this.#id}`);
    this.#character.sendImmediate('You are no longer surrounded by a soft light.');
  }
}

export default RecitationOfLight;