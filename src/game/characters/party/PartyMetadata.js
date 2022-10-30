//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import PartyMetadataError from './PartyMetadataError.js';
import PartyMetadataAutoAttack from './PartyMetadataAutoAttack.js';
import PartyMetadataAutoFollow from './PartyMetadataAutoFollow.js';

/**
 * Container for party metadata
 */
class PartyMetadata {
  #metadataStrategies;
  #metadata;

  /**
   * Create new party metadata
   */
  constructor() {

    this.#metadata = {};
    this.#metadataStrategies = {
      'auto-attack': new PartyMetadataAutoAttack(),
      'auto-follow': new PartyMetadataAutoFollow(),
    };

  }

  /**
   * Set party metadata for the character
   *
   * @param {Character} character      - The character setting the metadata
   * @param {Object} metadata
   * @param {String} metadata.property - The name of the property being set
   * @param {String} metadata.value    - The string value
   * @param {String} [metadata.target] - Optional target being set
   *
   * @throws {PartyMetadataError}
   */
  set(character, metadata) {
    const { property, value, target = null } = metadata;

    // Throw here if we don't know what the property is
    if (!(property in this.#metadataStrategies)) {
      throw new PartyMetadataError(`${property} is not a valid party setting.`);
    }

    if (!(character.id in this.#metadata)) {
      this.#metadata[character.id] = {};
    }
    if (!(property in this.#metadata[character.id])) {
      this.#metadata[character.id][property] = {};
    }

    const newValue = { value, target };
    const oldValue = this.#metadata[character.id][property];
    this.#metadataStrategies[property].validate(character, newValue, oldValue);
    const createdValue = this.#metadataStrategies[property].create(character, newValue, oldValue);
    this.#metadata[character.id][property] = createdValue;
  }

  /**
   * Convert the metadata to JSON
   *
   * @param {Character} character - The character to get metadata for
   *
   * @returns {Object}
   */
  toJson(character) {
    return Object.keys(this.#metadataStrategies).map(property => {
      if (!this.#metadata[character.id] || !this.#metadata[character.id][property]) {
        return null;
      }

      const value = this.#metadataStrategies[property].toJson(this.#metadata[character.id][property]);
      if (value) {
        return { property, value };
      }
      return null;
    }).filter(e => e);
  }

}

export default PartyMetadata;