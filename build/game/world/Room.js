//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import World from './World.js';
import DoorModel from '../../db/models/DoorModel.js';
import SpawnerModel from '../../db/models/SpawnerModel.js';
import loadCharacter from '../characters/loadCharacter.js';
import Door from '../objects/Door.js';
import Spawner from '../characters/spawners/Spawner.js';
import CombatManager from '../combat/CombatManager.js';
import { loadInanimate } from '../objects/inanimates.js';
import { ObjectContainer } from '../ObjectContainer.js';
import { capitalize } from '../../lib/stringHelpers.js';
import log from '../../lib/log.js';
import asyncForEach from '../../lib/asyncForEach.js';
import getOpposingDirection from '../../lib/getOpposingDirection.js';
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
        this.characters = new ObjectContainer();
        this.spawners = [];
        this.inanimates = new ObjectContainer();
        this.combatManager = new CombatManager();
        this.exits = {};
        this._onItemDestroyed = (item) => {
            this.sendImmediate([], `${item.toShortText()} decays`);
            this.removeItem(item);
        };
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
     * The unique ID of the area this room is in
     *
     * @return {String}
     */
    get areaId() {
        return this.model.areaId.toString();
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
            const exitInfo = { direction, };
            const exit = this.exits[direction];
            if (exit.door) {
                exitInfo.door = {
                    name: exit.door.toShortText(),
                    isOpen: exit.door.isOpen,
                };
            }
            return exitInfo;
        });
        const inanimates = this.inanimates.all.map(i => {
            return {
                summary: i.name,
            };
        });
        const characters = this.characters.all.filter(c => c.id !== characterId).map(c => {
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
     * @param {List<Character>} senders - The characters sending the message
     * @param {Object|String} message   - The message to send
     */
    sendImmediate(senders, message) {
        let sendersArray;
        sendersArray = senders.map((sender) => sender.id);
        this.mb.publish(this.id, {
            senders: sendersArray,
            message,
        });
    }
    /**
     * Remove a character from the room
     *
     * @param {Character} character - The character to remove from the room
     */
    removeCharacter(character) {
        if (!this.characters.all.includes(character)) {
            log.debug({ roomId: this.id, characterId: character.id }, 'Tried to remove character from room they are not in');
            return;
        }
        this.characters.removeItem(character);
    }
    /**
     * Add a character to the room
     *
     * @param {Character} character - The character to add to the room
     */
    addCharacter(character) {
        if (this.characters.all.includes(character)) {
            log.warn({ roomId: this.id, characterId: character.id }, 'Attempted to add duplicate character to room');
            return;
        }
        this.characters.addItem(character);
    }
    /**
     * Add an item to the floor of the room
     *
     * @param {Object} item - The inanimate item to add to the room
     *
     * @return {Boolean}
     */
    addItem(item) {
        log.debug({ roomId: this.id, itemId: item.id }, `Adding ${item.name} to room`);
        item.on('destroy', this._onItemDestroyed);
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
        const found = this.inanimates.removeItem(item);
        if (found) {
            item.removeListener('destroy', this._onItemDestroyed);
            return true;
        }
        return false;
    }
    /**
     * Retrieves a door if it exists from the room.
     *
     * This looks for a door on an exit in a Room. If multiple exits have a door
     * that matches, it returns the first it finds. If a direction is specified
     * in the form of '{direction}.{name}', it will limit it to the direction
     * specified.
     *
     * @param {String} name - The name of the door
     *
     * @returns {Door}
     */
    getDoor(name) {
        if (name.includes('.')) {
            const tokens = name.split('.');
            const direction = tokens[0];
            name = tokens.slice(1).join('.');
            if (!this.exits[direction] || !this.exits[direction].door
                || this.exits[direction].door.name !== name) {
                return null;
            }
            return this.exits[direction].door;
        }
        else {
            const item = Object.values(this.exits).find(e => e.door && e.door.name === name);
            if (item) {
                return item.door;
            }
            return null;
        }
    }
    /**
     * Main game loop update handler
     *
     * Called by the containing Area whenever the game loop updates
     */
    onTick() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.combatManager.onTick();
            yield asyncForEach(this.characters.all, (character) => __awaiter(this, void 0, void 0, function* () {
                yield character.onTick();
            }));
            yield asyncForEach(this.spawners, (spawner) => __awaiter(this, void 0, void 0, function* () {
                yield spawner.onTick();
            }));
        });
    }
    /**
     * Load in all the items from the model
     *
     * Unlike other objects, rooms perform a 'two-pass' load. This is largely due
     * to spawners, which need all the characters loaded up before they are loaded.
     * If not, they'll fail to find the characters they were previously tracking and
     * spawn another batch of them.
     *
     * @param {String} [loadSet] - optional. The set of things to load that reference
     *                             other objects.
     */
    load(loadSet) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!loadSet) {
                // Pull in the attributes from the model
                this.name = this.model.name;
                log.debug({ roomName: this.name }, 'Loading room');
                this.description = this.model.description;
                // Iterate over the Character IDs, create new instances of the characters,
                // then call load() on them (Or not? Characters have a room. We may want
                // them to do that.)
                if (this.model.characterIds) {
                    yield asyncForEach(this.model.characterIds, (characterId) => __awaiter(this, void 0, void 0, function* () {
                        const character = yield loadCharacter({ characterId, world: this.world });
                        if (!character) {
                            log.warn({ characterId, roomId: this.id }, 'Failed to load character');
                        }
                        else {
                            character.moveToRoom(this);
                            this.world.addCharacter(character);
                        }
                    }));
                }
                // Iterate over the Inanimate IDs, create new instances of the inanimates,
                // then call load() on them
                if (this.model.inanimates) {
                    yield asyncForEach(this.model.inanimates, (inanimateDef) => __awaiter(this, void 0, void 0, function* () {
                        const inanimate = yield loadInanimate(inanimateDef);
                        if (!inanimate) {
                            log.warn({
                                inanimateId: inanimateDef.inanimateId,
                                inanimateType: inanimateDef.inanimateType,
                                roomId: this.id,
                            }, 'Failed to load inanimate');
                        }
                        else {
                            this.inanimates.addItem(inanimate);
                        }
                    }));
                }
                if (this.model.exits) {
                    this.model.exits.forEach((exit) => {
                        const { destinationId, direction } = exit;
                        this.exits[direction] = {
                            direction,
                            destinationId: destinationId.toString(),
                        };
                    });
                }
            }
            else if (loadSet === 'doors') {
                log.debug({ roomName: this.name }, 'Loading doors');
                if (this.model.exits) {
                    yield asyncForEach(this.model.exits, (exit) => __awaiter(this, void 0, void 0, function* () {
                        const { doorId, direction, destinationId } = exit;
                        let door;
                        if (doorId) {
                            // Use the door on the destination if it's available
                            const destination = this.world.findRoomById(destinationId.toString());
                            if (destination) {
                                const opposingExit = destination.exits[getOpposingDirection(direction)];
                                if (opposingExit && opposingExit.door) {
                                    door = opposingExit.door;
                                    log.debug({
                                        roomId: this.id,
                                        destinationId: destination.id,
                                        doorId,
                                    }, 'Using door from destination');
                                }
                            }
                            // Unable to get door from the destination, which can happen since we
                            // may not have loaded them up yet. Go get the door from the DB.
                            if (!door) {
                                const doorModel = yield DoorModel.findById(doorId);
                                if (!doorModel) {
                                    log.warn({
                                        doorId,
                                        roomId: this.id,
                                    }, 'Failed to load door');
                                }
                                else {
                                    door = new Door(doorModel);
                                    yield door.load();
                                }
                            }
                        }
                        this.exits[direction].door = door;
                    }));
                }
            }
            else if (loadSet === 'spawners') {
                log.debug({ roomName: this.name }, 'Loading spawners');
                if (this.model.spawnerIds) {
                    yield asyncForEach(this.model.spawnerIds, (spawnerId) => __awaiter(this, void 0, void 0, function* () {
                        const spawnerModel = yield SpawnerModel.findById(spawnerId);
                        const spawner = new Spawner(spawnerModel, this);
                        yield spawner.load();
                        this.spawners.push(spawner);
                    }));
                }
            }
            else if (loadSet === 'quests') {
                yield asyncForEach(this.characters.all, (character) => __awaiter(this, void 0, void 0, function* () {
                    yield character.load('quests');
                }));
            }
            else {
                log.error({ loadSet }, 'Unknown load set');
            }
        });
    }
    /**
     * Save the current attributes in the room to the database
     */
    save() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.model.name = this.name;
                this.model.description = this.description;
                this.model.characterIds = [];
                yield asyncForEach(this.characters.all, (character) => __awaiter(this, void 0, void 0, function* () {
                    this.model.characterIds.push(character.id);
                    yield character.save();
                }));
                this.model.inanimates = this.inanimates.all.map((inanimate) => {
                    return {
                        inanimateId: inanimate.id,
                        inanimateType: inanimate.itemType,
                    };
                });
                yield asyncForEach(this.inanimates.all, (inanimate) => __awaiter(this, void 0, void 0, function* () {
                    yield inanimate.save();
                }));
                this.model.spawnerIds = [];
                yield asyncForEach(this.spawners, (spawner) => __awaiter(this, void 0, void 0, function* () {
                    this.model.spawnerIds.push(spawner.id);
                    yield spawner.save();
                }));
                yield asyncForEach(Object.keys(this.exits), (direction) => __awaiter(this, void 0, void 0, function* () {
                    const exit = this.exits[direction];
                    if (exit.door) {
                        yield exit.door.save();
                    }
                }));
                yield this.model.save();
            }
            catch (e) {
                log.error({ err: e, roomId: this.id }, 'Failed to save room');
            }
        });
    }
}
export default Room;
