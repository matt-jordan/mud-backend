//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import config from 'config';

import asyncForEach from '../../lib/asyncForEach.js';
import log from '../../lib/log.js';
import MessageBus from '../../lib/messagebus/MessageBus.js';
import { DefaultCommandSet } from '../commands/CommandSet.js';

/**
 * @module game/characters/PlayerCharacter
 */

const characterAttributes = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

const modifiableAttributes = ['hitpoints', 'manapoints', 'energypoints'];

// TODO: Take in an attribute and not the raw integer
function attributeModifier(value) {
  return (value - 10) / 2;
}

/**
 * Class representing a playable character
 */
class PlayerCharacter {

  /**
   * Create a new PlayableCharacter
   *
   * @param {CharacterModel} model - The underlying DB model
   * @param {World} world - The world object the character is placed into
   */
  constructor(model, world) {
    this.model = model;
    this._id = this.model._id.toString();
    this.mb = MessageBus.getInstance();
    this._topics = {};
    this._transport = null;
    this.world = world;
    this.commandSets = [ DefaultCommandSet, ];

    this.name = 'Unknown';
    this.description = '';
    this.gender = '';
    this.classes = [];
    this.age = 25;
    this.attributes = {};
    this.room = null;
    characterAttributes.forEach((attribute) => {
      this.attributes[attribute] = {};
      this.attributes[attribute].base = 10;
      this.attributes[attribute].current = 10;
    });
    modifiableAttributes.forEach((attribute) => {
      this.attributes[attribute] = {};
      this.attributes[attribute].base = 0;
      this.attributes[attribute].current = 0;
      this.attributes[attribute].regen = 0;
    });
  }

  /**
   * Return the transport the character is using
   *
   * @return {EventEmitter} Some transport object that extends EventEmitter
   */
  get transport() {
    return this._transport;
  }

  /**
   * Set the transport object
   *
   * @param {EventEmitter} _transport - The transport we'll use for this character
   */
  set transport(_transport) {
    if (this._transport) {
      this._transport.close();
    }
    log.debug({ characterId: this.id }, 'Associating transport to character');
    this._transport = _transport;

    this._transport.on('disconnect', () => {
      log.debug({ characterId: this.id },
        'Disconnect event received; dis-associating from character');
      this._transport = null;
    });

    this._transport.on('message', async (message) => {
      try {
        const rcvMessage = JSON.parse(message);
        if (!rcvMessage.messageType) {
          log.debug({ rcvMessage }, 'No messageType');
          return;
        }

        const generatedCommands = [];
        this.commandSets.forEach((commandSet) => {
          const command = commandSet.generate(rcvMessage.messageType, rcvMessage.parameters);
          if (command) {
            log.debug({ characterId: this.id, command: rcvMessage.messageType }, 'Generated command');
            generatedCommands.push(command);
          }
        });

        await asyncForEach(generatedCommands, async (command) => {
          await command.execute(this);
        });
      } catch (e) {
        log.warn({ message: e.message}, 'Error');
      }
    });
  }

  /**
   * A unique ID for this player character
   *
   * @return {String} unique ID
   */
  get id() {
    return this._id;
  }

  /**
   * Get a short text description of this player character
   *
   * @return {String}
   */
  toShortText() {
    return `${this.name}`;
  }

  /**
   * Send a message to this player character
   *
   * This does not schedule the message, but rather immediately sends it out
   * over the player character's underlying transport.
   *
   * @param {Object|String} message - The message to send. This can be a plain
   *                                  Javascript Object (JSON) or String.
   */
  sendImmediate(message) {
    if (!this._transport) {
      return;
    }

    let jsonMessage;
    if (typeof message !== 'object') {
      jsonMessage = {
        messageType: 'TextMessage',
        message: `${message}`,
      };
    } else {
      jsonMessage = message;
    }
    log.debug({ characterId: this.id, message: jsonMessage }, 'Sending message');
    this._transport.send(JSON.stringify(jsonMessage));
  }

  /**
   * Convert this character into a detailed update for the client
   *
   * This converts the character into a status update.
   * @returns {Object} CharacterDetails object
   */
  toCharacterDetailsMessage() {
    return {
      messageType: 'CharacterDetails',
      character: {
        id: this.id,
        name: this.name,
        attributes: {
          ...this.attributes,
        },
      },
    };
  }

  /**
   * Move the character to a new room
   *
   * This performs a slightly complicated set of actions to move the character
   * from their existing room to a new room. At a high level:
   *  1. If the character is in a room, it unsubscribes the character from the
   *     room and removes them from it.
   *  2. It associates the new room to this character, and adds them to that
   *     room.
   *  3. It subscribes to the new room's topic.
   *
   * @param {Room} room - The room to move into
   */
  moveToRoom(room) {
    // TODO: Make this more robust with weight, strength, etc.
    const energydelta = Math.max((3 - attributeModifier(this.attributes.strength.current)), 1);
    if (this.attributes.energypoints.current - energydelta <= 0) {
      this.sendImmediate('You are too exhausted.');
      return;
    }
    this.attributes.energypoints.current -= energydelta;

    if (this.room) {
      this.mb.unsubscribe(this._topics[this.room.id]);
      this._topics[this.room.id] = null;
      this.room.removeCharacter(this);
    }

    log.debug({ characterId: this.id, roomId: room.id }, 'Moving to room');
    this.room = room;
    this.room.addCharacter(this);

    const new_sub = this.mb.subscribe(this.room.id, (packet) => {
      // By default suppresss messages sent by yourself.
      if (packet.sender && packet.sender === this.id) {
        if (!packet.options || !packet.options.sendToSelf) {
          log.debug({ characterId: this.id }, 'Suppressing message to self');
          return;
        }
      }

      this.sendImmediate(packet.text);
    });
    this._topics[this.room.id] = new_sub;

    // Send the character the room description when they enter into it
    this.sendImmediate(this.toCharacterDetailsMessage());
    this.sendImmediate(room.toRoomDetailsMessage(this.id));
  }

  /**
   * Main game loop update handler
   *
   * Called by the containing Room whenever the game loop updates
   */
  onTick() {
    const currentEnergypoints = this.attributes.energypoints.current;
    const currentManapoints = this.attributes.manapoints.current;
    const currentHitpoints = this.attributes.hitpoints.current;

    if (this.attributes.energypoints.current < this.attributes.energypoints.base) {
      this.attributes.energypoints.current = Math.min(
        this.attributes.energypoints.current + this.attributes.energypoints.regen,
        this.attributes.energypoints.base);
    }
    if (this.attributes.hitpoints.current < this.attributes.hitpoints.base) {
      this.attributes.hitpoints.current = Math.min(
        this.attributes.hitpoints.current + this.attributes.hitpoints.regen,
        this.attributes.hitpoints.base);
    }
    if (this.attributes.manapoints.current < this.attributes.manapoints.base) {
      this.attributes.manapoints.current = Math.min(
        this.attributes.manapoints.current + this.attributes.manapoints.regen,
        this.attributes.manapoints.base);
    }

    if (this.attributes.energypoints.current !== currentEnergypoints
      || this.attributes.hitpoints.current !== currentHitpoints
      || this.attributes.manapoints.current !== currentManapoints) {
      this.sendImmediate(this.toCharacterDetailsMessage());
    }
  }

  /**
   * Load the character
   *
   * This associates the in-memory representation of the character (the instance
   * of this class) with the model that was provided.
   *
   * This should be called after constructing the player character.
   */
  async load() {
    this.name = this.model.name;
    this.description = this.model.description;
    this.age = this.model.age;
    this.gender = this.model.gender;
    this.race = this.model.race;
    // This should likely map to specific instances of a class
    this.classes = this.model.classes;

    // Eventually we'll want to apply modifiers
    characterAttributes.forEach((attribute) => {
      this.attributes[attribute].base = this.model.attributes[attribute].base;
      this.attributes[attribute].current = this.attributes[attribute].base;
    });
    modifiableAttributes.forEach((attribute) => {
      this.attributes[attribute].base = this.model.attributes[attribute].base;
      this.attributes[attribute].current = this.model.attributes[attribute].current;
    });

    // TODO: We should eliminate the magic numbers out of here
    this.attributes.hitpoints.regen = 0;
    this.attributes.manapoints.regen = Math.max(
      attributeModifier(this.attributes.intelligence.current),
      attributeModifier(this.attributes.wisdom.current),
      1);
    this.attributes.energypoints.regen = 5 + attributeModifier(this.attributes.constitution.current);

    // Find the Room and move us into it...
    let roomId;
    if (this.model.roomId) {
      roomId = this.model.roomId.toString();
    } else {
      roomId = config.game.defaultRoomId;
    }
    const room = this.world.findRoomById(roomId);
    if (room) {
      this.moveToRoom(room);
    }
  }

  /**
   * Save the character
   *
   * This updates the underlying database model with the current attributes
   * of the character, then persists it to the underlying database.
   */
  async save() {
    this.model.name = this.name;
    this.model.description = this.description;
    this.model.age = this.age;
    this.model.gender = this.gender;
    this.model.race = this.race;
    // Again, this will need its own serializer
    this.model.classes = this.classes.map((characterClass) => {
      return {
        type: characterClass.type,
        level: characterClass.level,
        experience: characterClass.experience,
      };
    });

    if (this.room) {
      this.model.roomId = this.room.id;
    }

    characterAttributes.forEach((attribute) => {
      this.model.attributes[attribute].base = this.attributes[attribute].base;
    });
    modifiableAttributes.forEach((attribute) => {
      this.model.attributes[attribute].base = this.attributes[attribute].base;
      this.model.attributes[attribute].current = this.attributes[attribute].current;
    });

    await this.model.save();
  }
}

export default PlayerCharacter;