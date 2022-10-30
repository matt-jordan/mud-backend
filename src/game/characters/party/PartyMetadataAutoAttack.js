//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import PartyMetadataError from './PartyMetadataError.js';
import log from '../../../lib/log.js';

/**
 * A handler for setting up auto-attack on a character
 */
class PartyMetadataAutoAttack {

  /**
   * Create a new PartyMetadataAutoAttack
   */
  constructor() {
  }

  /**
   * Validate the settings based on the current state of the metadata
   *
   * @param {Character} character         - The character setting the metadata
   * @param {Object}    newValue
   * @param {String}    newValue.value    - The value
   * @param {Character} newValue.[target] - Optional. Target to set.
   * @param {Object}    oldValue
   * @param {String}    oldValue.value    - The old value
   * @param {Character} oldValue.[target] - Optional. Previous target.
   *
   * @throws {PartyMetadataError}
   */
  validate(character, newValue, oldValue) {
    const { value: newSetting, target: newTarget = null } = newValue;
    const { target: oldTarget = null } = oldValue;

    if (newSetting !== 'on' && newSetting !== 'off') {
      throw new PartyMetadataError(`Invalid setting '${newSetting}' for auto-attack.`);
    }

    if (newSetting === 'off' && !oldTarget) {
      throw new PartyMetadataError('You are not set up to auto-attack for anyone.');
    }

    if (newSetting === 'on') {
      if (!newTarget) {
        throw new PartyMetadataError('You must provide a valid party member to auto-attack for.');
      }

      if (newTarget === oldTarget) {
        throw new PartyMetadataError(`You are already set up to auto-attack for '${newTarget.toShortText()}'.`);
      }

      if (newTarget === character) {
        throw new PartyMetadataError('You cannot auto-attack for yourself.');
      }
    }
  }

  /**
   * Validate the settings based on the current state of the metadata
   *
   * @param {Character} character         - The character setting the metadata
   * @param {Object}    newValue
   * @param {String}    newValue.value    - The value
   * @param {Character} newValue.[target] - Optional. Target to set.
   * @param {Object}    oldValue
   * @param {String}    oldValue.value    - The old value
   * @param {Character} oldValue.[target] - Optional. Previous target.
   */
  create(character, newValue, oldValue) {
    const { value: newSetting, target: newTarget = null } = newValue;
    const { target: oldTarget = null, callback: oldCallback = null } = oldValue;
    const attackCallback = (attacker, defender) => {
      const room = attacker.room;
      if (room !== character.room) {
        log.debug({ roomId: character.room.id, attackerRoomId: room.id }, 'Not auto-attacking: attacker room is not our room');
        return;
      }

      const combat = room.combatManager.getCombat(character);
      if (combat) {
        log.debug({ characterId: character.id, roomId: character.room.id, attackerId: attacker.id }, 'Not auto-attacking: character is already in combat');
        return;
      }

      log.debug({ characterId: character.id, attackerId: attacker.id, defenderId: defender.id }, 'Auto-attacking to assist attacker against defender');
      character.sendImmediate(`You assist ${attacker.toShortText()} and attack ${defender.toShortText()}!`);
      room.combatManager.addCombat(character, defender);
    };

    if (oldTarget && oldCallback) {
      log.debug({ characterId: character.id }, `Character is no longer auto-attacking ${oldTarget.id}`);
      character.sendImmediate(`You are no longer auto-attacking for '${oldTarget.toShortText()}'.`);
      oldTarget.removeListener('attack', oldCallback);
    }

    if (newSetting === 'on') {
      log.debug({ characterId: character.id }, `Character is now auto-attacking ${newTarget.id}`);
      character.sendImmediate(`You are now auto-attacking for '${newTarget.toShortText()}'`);
      newTarget.on('attack', attackCallback);
    }

    return {
      value: newSetting,
      target: newTarget,
      callback: attackCallback,
    };
  }

  /**
   * Convert metadata to JSON
   *
   * @param {Object} currentValue - The current value of the metadata
   *
   * @returns {Object}
   */
  toJson(currentValue) {
    const { value, target } = currentValue;

    if (value === 'on' && target) {
      return target.toShortText();
    }
    return null;
  }
}


export default PartyMetadataAutoAttack;