//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import Party from '../../characters/party/Party.js';
import PartyMetadataError from '../../characters/party/PartyMetadataError.js';

/**
 * Command that sets properties on the party
 */
class PartySet {

  /**
   * Create a new PartySet command
   *
   * @param {Object}
   * @param {String} property - The property to set
   * @param {String} value    - The value to assign
   * @param {String} [target] - Optional. Target of the property.
   */
  constructor({ property, value, target = null }) {
    this.property = property;
    this.value = value;
    this.target = target;
  }

  /**
   * The character to execute the commands on
   *
   * @param {Character} character - The character who invoked the command
   */
  async execute(character) {
    const party = Party.getParty(character);
    if (!party) {
      character.sendImmediate('You are not in a party.');
      return;
    }

    try {
      party.setProperty(character, {
        property: this.property,
        value: this.value,
        target: this.target,
      });
    } catch (err) {
      if (err instanceof PartyMetadataError) {
        character.sendImmediate(err.message);
      } else {
        throw err;
      }
    }
  }
}

export { PartySet };
