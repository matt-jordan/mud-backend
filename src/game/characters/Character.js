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
import { inanimateNameComparitor, InanimateContainer, loadInanimate } from '../objects/inanimates.js';

/**
 * @module game/characters/Character
 */

const characterAttributes = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

const modifiableAttributes = ['hitpoints', 'manapoints', 'energypoints'];

/**
 * Class representing a playable character
 */
class Character {

  /**
   * Get a list of the physical locations a character can have
   *
   * @returns {Array<String>}
   */
  static get physicalLocations() {
    return ['head', 'body', 'neck', 'hands', 'legs', 'feet', 'leftFinger', 'rightFinger', 'leftHand', 'rightHand', 'back'];
  }

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
    this.room = null;
    this.inanimates = new InanimateContainer();
    this.carryWeight = 0;

    this.attributes = {};
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

    this.physicalLocations = {};
    Character.physicalLocations.forEach((location) => {
      this.physicalLocations[location] = {
        item: null,
      };
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
   * Get the size of the character
   *
   * @return {String} size
   */
  get size() {
    return this.model.size;
  }

  /**
   * Handle a character dying.
   */
  async _handleDeath() {
    if (this.transport) {
      this.transport.close();
      this.transport = null;
    }

    // make a corpse.

    // Remove the character from the world and the room
    this.room.removeCharacter(this);
    // TODO: Move to world...
    const index = this.world.characters.indexOf(this);
    if (index > -1) {
      this.world.characters.splice(index, 1);
    }
    await this.save();
    await this.room.save();
  }

  /**
   * Apply damage to this character
   *
   * Note that we'll need to eventually think about applying this to other
   * attributes, but we'll do this slowly.
   *
   * @param {Number} damage - The damage to apply.
   */
  applyDamage(damage) {
    const delta = this.attributes.hitpoints.current - damage;
    this.attributes.hitpoints.current = Math.max(delta, 0);
    if (this.attributes.hitpoints.current === 0) {
      // He's dead, Jim. Trigger the logic!
      this.sendImmediate('You have died.');

      this._handleDeath();
    }
  }

  /**
   * Get the modifier value for the character's current attribute value
   *
   * @param {String} attribute - The character attribute to look up
   *
   * @param {Number}
   */
  getAttributeModifier(attribute) {
    if (!(attribute in this.attributes)) {
      return 0;
    }
    return ((this.attributes[attribute].current - 10) / 2);
  }

  /**
   * A pronoun for the character based on their gender
   *
   * @returns {String}
   */
  get pronoun() {
    switch (this.model.gender) {
    case 'male':
      return 'his';
    case 'female':
      return 'her';
    case 'non-binary':
    default:
      return 'their';
    }
  }

  /**
   * The character's weight
   *
   * @return {Number}
   */
  get weight() {
    return this.model.weight;
  }

  /**
   * The maximum amount of weight the character can carry
   *
   * @returns {Number}
   */
  get maxCarryWeight() {
    return (15 * this.attributes.strength.current);
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
   * Get a long text description of this player character
   *
   * @return {String}
   */
  toLongText() {
    return `${this.name}\n${this.model.description}`;
  }

  /**
   * Find an item that is currently on a character's body
   *
   * @param {String} name       - The name of the item to find
   * @param {String} [location] - Optional body location to restrict to
   *
   * @returns {Object} The item if found or null
   */
  findItemsOnCharacter(name, location = null) {
    const locations = [];
    const items = [];

    if (location) {
      locations.push(location);
    } else {
      locations.push(...Character.physicalLocations);
    }

    locations.forEach((location) => {
      if (this.physicalLocations[location]
        && this.physicalLocations[location].item
        && inanimateNameComparitor(name, this.physicalLocations[location].item.name)) {
        items.push({
          location,
          item: this.physicalLocations[location].item,
        });
      }
    });

    return items;
  }

  /**
   * Remove an item from a character's physical location
   *
   * @param {String} name     - The name of the item to remove
   * @param {String} location - The body location of the item
   *
   * @returns {Object} The removed object, or null
   */
  removeItemOnCharacter(name, location) {
    if (!this.physicalLocations[location]
      || !this.physicalLocations[location].item
      || !inanimateNameComparitor(name, this.physicalLocations[location].item.name)) {
      return null;
    }

    const item = this.physicalLocations[location].item;
    this.physicalLocations[location].item = null;
    return item;
  }

  /**
   * Give the character an item to haul around in their inventory
   *
   * Because the player can haul around containers with their own weight, and that
   * weight can change as the player adds things to it, we calculate the carryWeight
   * of the player based on the events that fire from those items.
   *
   * @param {Object} item - The item to haul. Should be an inanimate of some type.
   */
  addHauledItem(item) {
    this.carryWeight += item.weight;
    item.onWeightChangeCb = (item, oldWeight, newWeight) => {
      this.carryWeight -= oldWeight;
      this.carryWeight += newWeight;
    };
    this.inanimates.addItem(item);
  }

  /**
   * Remove a hauled item from the character
   *
   * @param {Object} _item - The item to remove.
   *
   * @return {Boolean} true if the item is removed, false otherwise
   */
  removeHauledItem(_item) {
    const item = this.inanimates.findAndRemoveItem(_item.name);
    if (!item) {
      return false;
    }
    item.onWeightChangeCb = null;
    this.carryWeight -= item.weight;
    return true;
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
    const startingEnergyPenalty = 3 + Math.max(0, this.carryWeight - this.maxCarryWeight);
    const energydelta = Math.max(startingEnergyPenalty - this.getAttributeModifier('strength'));
    if (this.attributes.energypoints.current - energydelta <= 0) {
      this.sendImmediate('You are too exhausted.');
      return;
    }
    this.attributes.energypoints.current -= energydelta;

    if (this.room) {
      if (this.room.combatManager.checkCombat(this)) {
        this.sendImmediate('You cannot move, you are currently in combat!');
        return;
      }

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
      this.getAttributeModifier('intelligence'),
      this.getAttributeModifier('wisdom'),
      1);
    this.attributes.energypoints.regen = 5 + this.getAttributeModifier('constitution');

    await asyncForEach(Character.physicalLocations, async (physicalLocation) => {
      if (this.model.physicalLocations[physicalLocation]) {
        const modelDef = this.model.physicalLocations[physicalLocation].item;
        if (modelDef) {
          const item = await loadInanimate(modelDef);
          this.carryWeight += item.weight;
          this.physicalLocations[physicalLocation].item = item;
        }
      }
    });

    if (this.model.inanimates) {
      await asyncForEach(this.model.inanimates, async (inanimateDef) => {
        const inanimate = await loadInanimate(inanimateDef);
        if (inanimate) {
          this.addHauledItem(inanimate);
        }
      });
    }

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
    // TODO: Again, this will need its own serializer
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

    this.model.inanimates = this.inanimates.all.map((inanimate) => {
      return {
        inanimateId: inanimate.id,
        inanimateType: inanimate.itemType,
      };
    });

    Character.physicalLocations.forEach((location) => {
      if (this.physicalLocations[location].item) {
        this.model.physicalLocations[location] = {
          item: {
            inanimateId: this.physicalLocations[location].item.id,
            inanimateType: this.physicalLocations[location].item.itemType,
          },
        };
      } else if (this.model.physicalLocations[location] && this.model.physicalLocations[location].item) {
        this.model.physicalLocations[location].item = null;
      }
    });

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

export default Character;