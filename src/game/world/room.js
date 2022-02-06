//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import World from './world.js';
import SpawnerModel from '../../db/models/SpawnerModel.js';
import loadCharacter from '../characters/loadCharacter.js';
import Spawner from '../characters/spawners/Spawner.js';
import { InanimateContainer, loadInanimate } from '../objects/inanimates.js';

import { capitalize } from '../../lib/stringHelpers.js';
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
    this.world = World.getInstance();
    this.model = model;
    this._id = this.model._id.toString();
    this.name = 'Unloaded';
    this.description = '';
    this.characters = [];
    this.spawners = [];
    this.inanimates = new InanimateContainer();
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

    const inanimates = this.inanimates.all.map(i => {
      return {
        summary: i.name,
      };
    });

    const characters = this.characters.filter(c => c.id !== characterId).map(c => {
      return {
        summary: capitalize(c.toShortText()),
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
   * Send a message to the room
   *
   * @param {Character} sender - The person sending the message
   * @param {Object|String} message - The message to send
   */
  sendImmediate(sender, message) {
    this.mb.publish(this.id, {
      sender: sender.id,
      text: message
    });
  }

  /**
   * Remove a character from the room
   *
   * @param {Character} character - The character to remove from the room
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

    this.sendImmediate(character, `${character.toShortText()} leaves`);
  }

  /**
   * Add a character to the room
   *
   * @param {Character} character - The character to add to the room
   */
  addCharacter(character) {
    if (this.characters.includes(character)) {
      log.warn({ roomId: this.id, characterId: character.id },
        'Attempted to add duplicate character to room');
      return;
    }
    this.characters.push(character);

    this.sendImmediate(character, `${character.toShortText()} enters`);
  }

  /**
   * Add an item to the floor of the room
   *
   * @param {Object} item - The inanimate item to add to the room
   *
   * @return {Boolean}
   */
  addItem(item) {
    this.inanimates.addItem(item);
    return true;
  }

  /**
   * Remove an item from the room
   *
   * @param {Object} item - The item to remove
   *
   * @return {Boolean} True if removed, false if not
   */
  removeItem(item) {
    const found = this.inanimates.findAndRemoveItem(item.name);

    return found ? true : false;
  }

  /**
   * Main game loop update handler
   *
   * Called by the containing Area whenever the game loop updates
   */
  async onTick() {
    await asyncForEach(this.characters, async (character) => {
      await character.onTick();
    });

    await asyncForEach(this.spawners, async (spawner) => {
      await spawner.onTick();
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
    if (this.model.characterIds) {
      await asyncForEach(this.model.characterIds, async (characterId) => {
        const character = await loadCharacter({ characterId, world: this.world });
        character.moveToRoom(this);
        this.world.characters.push(character);
      });
    }

    // Iterate over the Inanimate IDs, create new instances of the inanimates,
    // then call load() on them
    if (this.model.inanimates) {
      await asyncForEach(this.model.inanimates, async (inanimateDef) => {
        const inanimate = await loadInanimate(inanimateDef);
        if (inanimate) {
          this.inanimates.addItem(inanimate);
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

    // Load up spawners
    if (this.model.spawnerIds) {
      await asyncForEach(this.model.spawnerIds, async (spawnerId) => {
        const spawnerModel = await SpawnerModel.findById(spawnerId);
        const spawner = new Spawner(spawnerModel, this);
        await spawner.load();
        this.spawners.push(spawner);
      });
    }
  }

  /**
   * Save the current attributes in the room to the database
   */
  async save() {
    this.model.name = this.name;
    this.model.description = this.description;

    this.model.characterIds = [];
    await asyncForEach(this.characters, async (character) => {
      this.model.characterIds.push(character.id);
      await character.save();
    });

    // Generally, inanimates themselves shouldn't have their state changed
    // while they're lying on the floor of the room. The only thing we should
    // have to do is keep track of the fact that they exist.
    this.model.inanimates = this.inanimates.all.map((inanimate) => {
      return {
        inanimateId: inanimate.id,
        inanimateType: inanimate.itemType,
      };
    });

    this.model.spawnerIds = [];
    await asyncForEach(this.spawners, async (spawner) => {
      this.model.spawnerIds.push(spawner.id);
      await spawner.save();
    });

    await this.model.save();
  }

}

export default Room;
