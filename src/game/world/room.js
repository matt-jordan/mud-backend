//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import { loadInanimate } from '../objects/inanimates.js';
import log from '../../lib/log.js';
import asyncForEach from '../../lib/asyncForEach.js';
import MessageBus from '../../lib/messagebus/MessageBus.js';

/**
 * @module game/world/Room
 */

/**
 * A class that defines the place in which a player interacts with things
 */
class Room {

  /**
   * Create a new room
   *
   * @param {RoomModel} model - The underlying database model for a room
   */
  constructor(model) {
    this.model = model;
    this._id = this.model._id.toString();
    this.name = 'Unloaded';
    this.description = '';
    this.characters = [];
    this.inanimates = [];
    this.exits = {};

    this.mb = MessageBus.getInstance();
  }

  /**
   * A unique ID for this room
   *
   * @return {String}
   */
  get id() {
    return this._id;
  }

  /**
   * Get a short text description of this room
   *
   * @return {String}
   */
  toShortText() {
    return `${this.name}`;
  }

  /**
   * Get a long text description of this room
   *
   * @return {String}
   */
  toText() {
    const exitDirections = Object.keys(this.exits);
    const exitText = `Exits: ${exitDirections.length !== 0 ? exitDirections.join(', ') : 'None'}`;

    return `${this.name}\n${this.description}\n${exitText}`;
  }

  /**
   * Convert the room to a RoomDetails message
   *
   * @param {String} [characterId] - The ID of the character to filter out
   * @return {Object}
   */
  toRoomDetailsMessage(characterId = null) {
    const exits = Object.keys(this.exits).map(direction => {
      return {
        direction: direction,
      };
    });

    const inanimates = this.inanimates.map(i => {
      return {
        summary: i.name,
      };
    });

    const characters = this.characters.filter(c => c.id !== characterId).map(c => {
      return {
        summary: c.name,
      };
    });

    return {
      messageType: 'RoomDetails',
      roomId: this.id,
      summary: this.name,
      description: this.description,
      exits,
      characters,
      inanimates,
    };
  }

  /**
   * Remove a character from the room
   *
   * @param {PlayerCharacter} character - The character to remove from the room
   */
  removeCharacter(character) {
    if (!this.characters.includes(character)) {
      log.debug({ roomId: this.id, characterId: character.id },
        'Tried to remove character from room they are not in');
      return;
    }
    const index = this.characters.indexOf(character);
    if (index > -1) {
      this.characters.splice(index, 1);
    }

    this.mb.publish(this.id, {
      sender: character.id,
      text: `${character.toShortText()} leaves`,
    });
  }

  /**
   * Add a character to the room
   *
   * @param {PlayerCharacter} character - The character to add to the room
   */
  addCharacter(character) {
    if (this.characters.includes(character)) {
      log.warn({ roomId: this.id, characterId: character.id },
        'Attempted to add duplicate character to room');
      return;
    }
    this.characters.push(character);

    this.mb.publish(this.id, {
      sender: character.id,
      text: `${character.toShortText()} enters`,
    });
  }

  /**
   * Main game loop update handler
   *
   * Called by the containing Area whenever the game loop updates
   */
  onTick() {
    this.characters.forEach((character) => {
      character.onTick();
    });
  }

  /**
   * Load in all the items from the model
   */
  async load() {
    // Pull in the attributes from the model
    this.name = this.model.name;
    log.debug({ roomName: this.name }, 'Loading room');

    this.description = this.model.description;

    // Iterate over the Character IDs, create new instances of the characters,
    // then call load() on them (Or not? Characters have a room. We may want
    // them to do that.)

    // Iterate over the Inanimate IDs, create new instances of the inanimates,
    // then call load() on them
    if (this.model.inanimates) {
      await asyncForEach(this.model.inanimates, async (inanimateDef) => {
        const inanimate = await loadInanimate(inanimateDef);
        if (inanimate) {
          this.inanimates.push(inanimate);
        }
      });
    }

    // Load up exits and their Doors. Note that we don't have any Inanimates that
    // refer to that... so. Nothing yet.
    if (this.model.exits) {
      this.model.exits.forEach((exit) => {
        this.exits[exit.direction] = {
          direction: exit.direction,
          destinationId: exit.destinationId.toString(),
        };
      });
    }
  }

  /**
   * Save the current attributes in the room to the database
   */
  async save() {
    this.model.name = this.name;
    this.model.description = this.description;
    await asyncForEach(this.characters, async (character) => {
      // TODO: Save the character IDs?
      await character.save();
    });

    // Generally, inanimates themselves shouldn't have their state changed
    // while they're lying on the floor of the room. The only thing we should
    // have to do is keep track of the fact that they exist.
    this.model.inanimates = this.inanimates.map((inanimate) => {
      return {
        inanimateId: inanimate.id,
        inanimateType: inanimate.itemType,
      };
    });

    await this.model.save();
  }

}

export default Room;
