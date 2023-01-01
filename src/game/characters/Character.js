//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import config from 'config';
import EventEmitter from 'events';

import ActionEffectQueue from './helpers/ActionEffectQueue.js';
import characterDetails from './helpers/characterDetails.js';
import Conversation from './helpers/Conversation.js';
import CurrencyManager from './helpers/CurrencyManager.js';
import FactionManager from './helpers/FactionManager.js';
import Quest from './quests/Quest.js';

import CharacterModel from '../../db/models/CharacterModel.js';
import ConversationModel from '../../db/models/ConversationModel.js';
import QuestModel from '../../db/models/QuestModel.js';
import Fighter from '../classes/Fighter.js';
import Priest from '../classes/Priest.js';
import Rogue from '../classes/Rogue.js';
import Mage from '../classes/Mage.js';
import { interpretLanguage } from '../language/interpreter.js';
import { AdminCommandSet, DefaultCommandSet, SocialCommandSet } from '../commands/CommandSet.js';
import { ErrorFactory } from '../commands/default/Error.js';
import { objectNameComparitor, ObjectContainer } from '../ObjectContainer.js';
import { loadInanimate } from '../objects/inanimates.js';
import corpseFactory from '../objects/factories/corpses.js';
import currencyFactory from '../objects/factories/currency.js';
import asyncForEach from '../../lib/asyncForEach.js';
import DiceBag from '../../lib/DiceBag.js';
import log from '../../lib/log.js';
import MessageBus from '../../lib/messagebus/MessageBus.js';

/**
 * @module game/characters/Character
 */

const characterAttributes = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

const modifiableAttributes = ['hitpoints', 'manapoints', 'energypoints'];

/**
 * Death event
 *
 * @event Character#death
 * @type {object}
 * @property {Character} character - The character who just died
 */

/**
 * Kill event
 *
 * @event Character#kill
 * @type {object}
 * @property {Character} character       - The character who did the murdering
 * @property {Character} killedCharacter - The character who was just killed by this one
 */

/**
 * Move event
 *
 * @event Character#move
 * @type {object}
 * @property {Character} movedCharacter - The character who moved
 * @property {Room}      oldRoom        - The room the character was in
 * @property {Room}      newRoom        - The room they've moved to
 */

/**
 * Class representing a playable character
 */
class Character extends EventEmitter {

  /**
   * Convert a character's size to a relative weighting number
   *
   * @param {String} size - The size of the character
   *
   * @returns {Number}
   */
  static sizeToNumber(size) {
    const sizeMapping = {
      tiny: 0,
      small: 1,
      medium: 2,
      large: 3,
      giant: 4,
      collosal: 5,
    };
    if (!(size in sizeMapping)) {
      // Assume medium
      return 2;
    }
    return sizeMapping[size];
  }

  /**
   * States a player can be in
   */
  static get STATE() {
    return {
      NORMAL: 0,
      RESTING: 1,
      FIGHTING: 2,
      DEAD: 3,
    };
  }

  /**
   * Get a list of the physical locations a character can have
   *
   * @returns {Array<String>}
   */
  static get physicalLocations() {
    return ['head', 'body', 'neck', 'hands', 'legs', 'feet', 'arms', 'leftFinger', 'rightFinger', 'leftHand', 'rightHand', 'back'];
  }

  /**
   * Create a new PlayableCharacter
   *
   * @param {CharacterModel} model - The underlying DB model
   * @param {World} world - The world object the character is placed into
   */
  constructor(model, world) {
    super();
    this.model = model;
    this._id = this.model._id.toString();
    this.mb = MessageBus.getInstance();
    this._topics = {};
    this._transport = null;
    this.world = world;
    this.commandSets = [ AdminCommandSet, DefaultCommandSet, SocialCommandSet ];

    this.name = 'Unknown';
    this.description = '';
    this.gender = '';
    this.classes = [];
    this.age = 25;
    this.room = null;
    this.inanimates = new ObjectContainer();
    this.carryWeight = 0;
    this.language = 'common';

    this.currentState = Character.STATE.NORMAL;

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

    this.conversation = null;
    this.factions = new FactionManager(this);
    this.questsCompleted = [];
    this.questsGiven = [];
    this.currencies = new CurrencyManager();

    this.skills = new Map();
    // Add default skills
    this.skills.set('scholar', 0);
    this.skills.set('observation', 0);
    this.skillDice = new DiceBag(1, 100, 4);

    this.attackActions = new ActionEffectQueue();
    this.effects = new ActionEffectQueue();

    this._onItemWeightChange = (item, oldWeight, newWeight) => {
      this.carryWeight -= oldWeight;
      this.carryWeight += newWeight;
    };
    this._onItemDestroyed = (item) => {
      this.sendImmediate(`${item.toShortText()} decays`);
      this.inanimates.removeItem(item);
    };
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

    if (_transport) {
      log.debug({ characterId: this.id }, 'Associating transport to character');
    } else {
      log.debug({ characterId: this.id }, 'Removing transport from character');
    }
    this._transport = _transport;

    if (!this._transport) {
      return;
    }

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

        if (generatedCommands.length > 0) {
          await asyncForEach(generatedCommands, async (command) => {
            await command.execute(this);
          });
        } else {
          const errorAction = DefaultCommandSet.commands[ErrorFactory.name]
            .generate(rcvMessage.messageType, rcvMessage.parameters);
          await errorAction.execute(this);
        }
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
   * A reference tag for this character
   *
   * @return {String}
   */
  get characterRef() {
    return this.model.characterRef;
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
   * Get the attacks for this character
   *
   * @return {Object} Weapon properties
   * @return {Object.minDamage}
   * @return {Object.maxDamage}
   * @return {Object.damageType}
   * @return {Object.energyCost}
   * @return {Object.verbs}
   * @return {Object.verbs.firstPerson}
   * @return {Object.verbs.thirdPerson}
   */
  get attacks() {
    let attacks = [];

    if (!this.effects.every((e) => e.checkAction('attack'))) {
      return attacks;
    }

    if (this.physicalLocations.leftHand.item || this.physicalLocations.rightHand.item) {
      if (this.physicalLocations.rightHand.item && this.physicalLocations.rightHand.item.itemType === 'weapon') {
        const weapon = this.physicalLocations.rightHand.item;
        const attack = weapon.toAttack(this);
        if (weapon.model.properties.includes('versatile') && !this.physicalLocations.leftHand.item) {
          attack.maxDamage = attack.maxDamage * 1.5;
        }
        attacks.push(attack);
      }

      if (this.physicalLocations.leftHand.item && this.physicalLocations.leftHand.item.itemType === 'weapon') {
        const weapon = this.physicalLocations.leftHand.item;
        const attack = weapon.toAttack(this);
        if (weapon.model.properties.includes('versatile') && !this.physicalLocations.rightHand.item) {
          attack.maxDamage = attack.maxDamage * 1.5;
        }
        attacks.push(attack);
      }
    }

    if (attacks.length === 0) {
      attacks.push(...this.model.defaultAttacks);
    }

    // Add any special attacks ready to fire
    attacks.push(...this.attackActions.decrementAndExpire());

    return attacks;
  }

  /**
   * Add experience to the character based on the encounter level
   *
   * @param {Number} encounterLevel - The level of the character/quest/thing
   * @param {Number} partySize      - Size of the party
   */
  addExperience(encounterLevel, partySize = 1) {
    if (this.classes.length === 0) {
      log.debug({ characterId: this.id }, `${this.toShortText()}: ignoring experience gain due to no character class`);
      return;
    }

    const minLevel = this.classes.map((characterClass) => characterClass.level).reduce((a, b) => Math.min(a, b));
    if (!minLevel) {
      log.debug({ characterId: this.id }, `${this.toShortText()}: ignoring experience gain due to class with unknown level`);
      return;
    }

    const characterClass = this.classes.find(c => c.level === minLevel);
    if (!characterClass) {
      log.debug({ characterId: this.id }, `${this.toShortText()}: ignoring experience gain due to no character class`);
      return;
    }
    characterClass.addExperience(encounterLevel, partySize);
  }

  /**
   * Get the max level of the character
   *
   * @returns {Number}
   */
  getLevel() {
    return this.classes.map((characterClass) => characterClass.level).reduce((a, b) => Math.max(a,b), 1);
  }

  /**
   * Perform a skill check for this character
   *
   * Note that you should obtain skillLevel with getSkill, which is not invoked
   * through this to avoid recursive checks with the 'scholar' skill
   *
   * @param {Number} skillLevel - The current skill level
   * @param {String} attribute  - The attribute that modifies the skill
   *
   * @return {Number}
   */
  skillCheck(skillLevel, attribute) {
    const modifier = this.getAttributeModifier(attribute) ?? 0;
    const bonus = Math.max((skillLevel + modifier), 0);
    const roll = this.skillDice.getRoll();

    return roll + bonus;
  }

  /**
   * Get the current level of the skill
   *
   * Accessing skills through this method will automatically force a 'learn'
   * check where the character can improve at the skills. Hence you want to
   * use this method as opposed to accessing them directly in most game scenarios.
   *
   * @param {String} skill - The skill to access
   *
   * @return {Number}
   */
  getSkill(skill) {
    let skillLevel = this.skills.get(skill);
    if (!skillLevel) {
      // You don't have that skill
      return 0;
    }

    const maxLevel = this.getLevel();
    if (skillLevel >= maxLevel * 5) {
      // maxed out
      return skillLevel;
    }

    const scholarLevel = this.skills.get('scholar') ?? 0; // don't call recursively!
    if (this.skillCheck(scholarLevel, 'intelligence') >= 100) {
      skillLevel += 1;
      this.skills.set(skill, skillLevel);
      this.sendImmediate(`You have gotten better at '${skill}' (${skillLevel})`);
    }

    return skillLevel;
  }

  /**
   * Handle a character dying.
   */
  async _handleDeath() {
    log.debug({ characterId: this.id }, 'Handling death for character');
    if (this.transport) {
      this.transport.close();
      this.transport = null;
    }

    if (this.room) {
      // Note: we may want to move all of this into the corpse factory
      const corpse = await corpseFactory(this);
      if (corpse) {
        // Remove all equipment and put it in the corpse
        Character.physicalLocations.forEach((location) => {
          if (this.physicalLocations[location].item) {
            const item = this.physicalLocations[location].item;
            corpse.addItem(item);
            this.model.physicalLocations[location].item = null;
          }
        });

        // Move all hauled items into the corpse
        this.inanimates.all.forEach((item) => {
          corpse.addItem(item);
          this.inanimates.findAndRemoveItem(item.name);
        });

        // Create currencies and stuff them in the corpse
        const currencies = this.currencies.toJSON();
        await asyncForEach(currencies, async (currencyDef) => {
          const currency = await currencyFactory(currencyDef);
          corpse.addItem(currency);
        });
      }
      this.room.addItem(corpse);
      this.room.removeCharacter(this);
      this.mb.unsubscribe(this._topics[this.room.id]);
    }

    // If this character gives out quests, fail them and remove them
    await asyncForEach(this.questsGiven, async (quest) => {
      await quest.destroy();
      Quest.unregister(quest);
    });

    this.emit('death', this);

    // After this point, characters should be unusable.
    this.currentState = Character.STATE.DEAD;
    if (this.model.accountId) {
      this.model.isDead = true;
      await this.model.save();
    } else {
      await CharacterModel.deleteOne({ _id: this.model._id });
      this.model = null;
    }
  }

  /**
   * Apply damage to this character
   *
   * Note that we'll need to eventually think about applying this to other
   * attributes, but we'll do this slowly.
   *
   * @param {Number} damage - The damage to apply.
   */
  async applyDamage(damage) {
    const delta = this.attributes.hitpoints.current - damage;
    this.attributes.hitpoints.current = Math.max(delta, 0);
    this.sendImmediate(this.toCharacterDetailsMessage());
    if (this.attributes.hitpoints.current === 0) {
      // He's dead, Jim. Trigger the logic!
      this.sendImmediate('You have died.');

      await this._handleDeath();
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
  toLongText(observer = null) {
    let description;

    description = this.model.description;
    description += characterDetails(this, observer);

    return `${this.name}\n${description}`;
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
        && objectNameComparitor(name, this.physicalLocations[location].item.name)) {
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
      || !objectNameComparitor(name, this.physicalLocations[location].item.name)) {
      return null;
    }

    const item = this.physicalLocations[location].item;
    this.physicalLocations[location].item = null;
    log.debug({ characterId: this.id, itemId: item.id }, `${this.name} is no longer wearing ${item.name} on ${location}`);
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
    item.on('weightChange', this._onItemWeightChange);
    item.on('destroy', this._onItemDestroyed);
    log.debug({ characterId: this.id, itemId: item.id }, `${this.name} is now hauling ${item.name}`);
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
    item.removeListener('weightChange', this._onItemWeightChange);
    item.removeListener('destroy', this._onItemDestroyed);
    this.carryWeight -= item.weight;
    log.debug({ characterId: this.id, itemId: item.id }, `${this.name} is no longer hauling ${item.name}`);
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
        classes: this.classes.map(c => c.toJson()),
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
    if (!this.effects.every((e) => e.checkAction('move'))) {
      return;
    }

    if (this.currentState === Character.STATE.RESTING) {
      this.sendImmediate('You cannot move as you are currently resting.');
      return;
    }

    if (this.currentState === Character.STATE.FIGHTING) {
      this.sendImmediate('You cannot move as you are currently in combat!');
      return;
    }

    // Don't move if you don't need to
    if (this.room === room) {
      return;
    }

    const startingEnergyPenalty = 3 + Math.max(0, (this.carryWeight - this.maxCarryWeight));
    const energydelta = Math.max(1, (startingEnergyPenalty - this.getAttributeModifier('strength')));
    if (this.attributes.energypoints.current - energydelta <= 0) {
      this.sendImmediate('You are too exhausted.');
      return;
    }
    this.attributes.energypoints.current -= energydelta;

    const oldRoom = this.room;
    if (oldRoom) {
      this.mb.unsubscribe(this._topics[oldRoom.id]);
      this._topics[oldRoom.id] = null;
      oldRoom.sendImmediate([this], `${oldRoom.isDark ? 'something' : this.toShortText()} leaves.`);
      oldRoom.removeCharacter(this);
    }

    log.debug({ characterId: this.id, roomId: room.id }, 'Moving to room');
    this.room = room;
    this.room.sendImmediate([this], `${room.isDark ? 'something' : this.toShortText()} enters.`);
    this.room.addCharacter(this);
    this.emit('move', this, oldRoom, this.room);

    const new_sub = this.mb.subscribe(this.room.id, (packet) => {
      // By default suppresss messages sent by yourself.
      if (packet.senders && packet.senders.includes(this.id)) {
        if (!packet.options || !packet.options.sendToSelf) {
          log.debug({ characterId: this.id }, 'Suppressing message to self');
          return;
        }
      }

      let message = packet.message;
      // Handle social messages, which may be in a different language
      if (typeof message === 'object' && message.socialType) {
        const textMessage = interpretLanguage(message.language, this, message.text);
        message = `${message.sender} ${message.socialType}s "${textMessage}"`;
      }

      if (this.conversation) {
        this.conversation.onSay(packet, message, this.room);
      }

      this.sendImmediate(message);
    });
    this._topics[this.room.id] = new_sub;

    // Send the character the room description when they enter into it
    this.sendImmediate(this.toCharacterDetailsMessage());
    this.sendImmediate(room.toRoomDetailsMessage(this.id));
  }

  /**
   * Cause the character to rest
   */
  rest() {
    if (!this.effects.every((e) => e.checkAction('rest'))) {
      return;
    }

    if (this.currentState === Character.STATE.RESTING) {
      this.sendImmediate('You are already resting.');
      return;
    }
    if (this.currentState === Character.STATE.FIGHTING) {
      this.sendImmediate('You cannot rest, you are fighting!');
      return;
    }
    if (this.room) {
      this.room.sendImmediate([this], `${this.toShortText()} starts resting.`);
    }
    this.sendImmediate('You start resting.');
    this.currentState = Character.STATE.RESTING;
  }

  /**
   * Cause the character to stand up.
   *
   * If resting, this will cancel that state.
   */
  stand() {
    if (this.currentState === Character.STATE.NORMAL || this.currentState === Character.STATE.FIGHTING) {
      this.sendImmediate('You are already standing.');
      return;
    }
    if (this.room) {
      this.room.sendImmediate([this], `${this.toShortText()} stands up.`);
    }
    this.sendImmediate('You stand up.');
    this.currentState = Character.STATE.NORMAL;
  }

  /**
   * Note that this character has killed another character
   *
   * @param {Character} killedCharacter - The character that was killed
   */
  addKill(killedCharacter) {
    if (!this.model.kills) {
      this.model.kills = [];
    }

    let areaName;
    if (killedCharacter.room) {
      const areaId = killedCharacter.room.areaId;
      const area = this.world.findAreaById(areaId);
      areaName = area.name;
    }

    let existing;
    if (areaName) {
      existing = this.model.kills.find(k => k.name === killedCharacter.name && k.area === areaName);
    } else  {
      existing = this.model.kills.find(k => k.name === killedCharacter.name && !k.area);
    }

    if (existing) {
      existing.count += 1;
    } else {
      this.model.kills.push({
        name: killedCharacter.name,
        area: areaName,
        count: 1
      });
    }

    this.emit('kill', this, killedCharacter);
  }

  /**
   * Main game loop update handler
   *
   * Called by the containing Room whenever the game loop updates
   */
  onTick() {
    const expiredEffects = this.effects.decrementAndExpire();
    expiredEffects.forEach((effect) => {
      log.debug({ characterId: this.id, effect }, 'Effect expired off of character');
    });

    if (this.currentState !== Character.STATE.FIGHTING) {
      const currentEnergypoints = this.attributes.energypoints.current;
      const currentManapoints = this.attributes.manapoints.current;
      const currentHitpoints = this.attributes.hitpoints.current;

      if (this.attributes.energypoints.current < this.attributes.energypoints.base) {
        let energyRegen = this.attributes.energypoints.regen;
        if (this.currentState === Character.STATE.RESTING) {
          energyRegen = energyRegen * 2 + 1;
        }

        this.attributes.energypoints.current = Math.min(
          this.attributes.energypoints.current + energyRegen,
          this.attributes.energypoints.base);
      }

      if (this.attributes.hitpoints.current < this.attributes.hitpoints.base) {
        let hitpointRegen = this.attributes.hitpoints.regen;
        if (this.currentState === Character.STATE.RESTING) {
          hitpointRegen = hitpointRegen * 2 + 1;
        }

        this.attributes.hitpoints.current = Math.min(
          this.attributes.hitpoints.current + hitpointRegen,
          this.attributes.hitpoints.base);
      }

      if (this.attributes.manapoints.current < this.attributes.manapoints.base) {
        let manaRegen = this.attributes.manapoints.regen;
        if (this.currentState === Character.STATE.RESTING) {
          manaRegen = manaRegen * 2 + 1;
        }

        this.attributes.manapoints.current = Math.min(
          this.attributes.manapoints.current + manaRegen,
          this.attributes.manapoints.base);
      }

      if (this.attributes.energypoints.current !== currentEnergypoints
        || this.attributes.hitpoints.current !== currentHitpoints
        || this.attributes.manapoints.current !== currentManapoints) {
        this.sendImmediate(this.toCharacterDetailsMessage());
      }
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
  async load(loadSet = null) {
    log.debug({ characterId: this.model.id, characterName: this.model.name, loadSet }, 'Loading character');
    if (!loadSet) {
      this.name = this.model.name;
      this.description = this.model.description;
      this.age = this.model.age;
      this.gender = this.model.gender;
      this.race = this.model.race;
      // This should likely map to specific instances of a class
      this.classes = this.model.classes.map((characterClass) => {
        let _class;
        switch (characterClass.type) {
        case 'fighter':
          _class = new Fighter(this);
          _class.experience = characterClass.experience;
          _class.level = characterClass.level;
          break;
        case 'priest':
          _class = new Priest(this);
          _class.experience = characterClass.experience;
          _class.level = characterClass.level;
          break;
        case 'mage':
          _class = new Mage(this);
          _class.experience = characterClass.experience;
          _class.level = characterClass.level;
          break;
        case 'rogue':
          _class = new Rogue(this);
          _class.experience = characterClass.experience;
          _class.level = characterClass.level;
          break;
        default:
          log.warn({ characterId: this.model._id.toString() }, `Unknown character class: ${characterClass.type}`);
        }

        return _class;
      }).filter(c => c);

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

      if (!this.model.defaultAttacks || this.model.defaultAttacks.length === 0) {
        // Add a default attack
        this.model.defaultAttacks = [
          { energyCost: 3, minDamage: 0, maxDamage: 1, damageType: 'bludgeoning', verbs: { firstPerson: 'punch', thirdPerson: 'punches' }},
        ];
      }

      if (this.model.skills) {
        this.model.skills.forEach((skill) => {
          this.skills.set(skill.name, skill.level);
        });
      }

      if (this.model.conversationId) {
        const conversationModel = await ConversationModel.findById(this.model.conversationId);
        if (!conversationModel) {
          log.warn({ characterId: this.model._id.toString(), conversationId: this.model.conversationId.toString() },
            'Unable to find conversation for character');
        } else {
          this.conversation = new Conversation(conversationModel, this);
          await this.conversation.load();
        }
      }

      if (this.model.factions) {
        await asyncForEach(this.model.factions, async (factionDef) => {
          await this.factions.initializeFaction(factionDef.name, factionDef.value);
        });
      }

      if (this.model.questsCompleted) {
        this.questsCompleted = [ ...this.model.questsCompleted ];
      }

      const questModels = await QuestModel.findByQuestGiver(this.model.characterRef);
      if (questModels) {
        await asyncForEach(questModels, async (questModel) => {
          const quest = new Quest(questModel, this);
          await quest.load();
          Quest.register(quest);

          this.questsGiven.push(quest);
        });
      }

      if (this.model.currencies) {
        this.model.currencies.forEach((currency) => {
          this.currencies.deposit(currency.name, currency.quantity);
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
      } else {
        // This may not be an error. On initial load, the room won't be fully loaded,
        // but the load will still succeed as the room will force them into it.
        log.debug({
          characterId: this.model._id.toString(),
          roomId,
        }, 'Unable to move to room: room unknown');
      }
    } else if (loadSet === 'quests') {
      // Find the quests we're in (not giving) and re-activate ourselves
      const quests = Quest.activeQuests(this);
      if (quests) {
        quests.forEach((quest) => {
          quest.loadCharacter(this);
        });
      }
    } else {
      log.error({ loadSet, characterId: this.id }, 'Unknown load set when loading character');
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
    this.model.classes = this.classes.map((characterClass) => {
      return {
        type: characterClass.characterType,
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

    this.model.skills = [];
    this.skills.forEach((value, key) => {
      this.model.skills.push({ name: key, level: value });
    });

    this.model.currencies = this.currencies.toJSON();

    if (this.conversation) {
      await this.conversation.save();
    }

    if (this.factions) {
      this.model.factions = this.factions.factionScores().map((faction) => {
        return { name: faction.name, value: faction.score };
      });
    }

    this.model.questsCompleted = [ ...this.questsCompleted ];

    asyncForEach(this.questsGiven, async (quest) => {
      await quest.save();
    });

    await this.model.save();
  }
}

export default Character;