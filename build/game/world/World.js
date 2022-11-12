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
import config from 'config';
import { v4 as uuid } from 'uuid';
import AreaModel from '../../db/models/AreaModel.js';
import SessionModel from '../../db/models/SessionModel.js';
import CharacterModel from '../../db/models/CharacterModel.js';
import PartyModel from '../../db/models/PartyModel.js';
import loadCharacter from '../characters/loadCharacter.js';
import Party from '../characters/party/Party.js';
import asyncForEach from '../../lib/asyncForEach.js';
import log from '../../lib/log.js';
import Area from './Area.js';
/**
 * @module game/world/World
 */
// Consider moving this
function authCheck(token) {
    return __awaiter(this, void 0, void 0, function* () {
        const session = yield SessionModel.findBySessionId(token);
        return session ? true : false;
    });
}
let theWorld;
/**
 * A world in which the player inhabits
 */
class World {
    /**
     * Get the one and only instance of the world
     *
     * @returns {World}
     */
    static getInstance(transport) {
        if (!theWorld) {
            theWorld = new World(transport);
        }
        return theWorld;
    }
    /**
     * Create a new world
     *
     * @param {EventEmitter} transport - The transport server for this world
     */
    constructor(transport) {
        this.areas = [];
        this.characters = [];
        this.clients = [];
        this.transport = transport;
        this._id = `world-${uuid()}`;
        this.tickCounter = 0;
        this.tickHandle = setInterval(this.onTick.bind(this), config.game.tickInterval || 3000);
        log.debug({ worldId: this._id }, 'Created world');
        // In some test scenarios there may be no transport server. If so, just pass on.
        if (!this.transport) {
            return;
        }
        this.transport.on('connection', (client) => {
            this.clients.push(client);
            client.on('message', (message) => __awaiter(this, void 0, void 0, function* () {
                let packet;
                try {
                    packet = JSON.parse(message);
                    log.info({ packet });
                    const token = packet.auth;
                    if (!token || !(yield authCheck(token))) {
                        client.send(JSON.stringify({ error: 'Unauthorized', message: 'Unauthorized client' }));
                        client.close();
                        return;
                    }
                    // Handle login of characters here; all other messages we let the Character
                    // interpret and handle
                    if (packet.messageType === 'LoginCharacter') {
                        const characterId = packet.characterId;
                        if (!characterId) {
                            log.debug({ worldId: this._id }, 'No characterId provided with LoginCharacter command!');
                            client.send(JSON.stringify({ error: 'BadMessage', message: 'Missing characterId' }));
                            return;
                        }
                        // Make sure we don't log in characters twice
                        const existingChar = this.characters.find((c) => c.id === characterId);
                        if (existingChar) {
                            log.debug({ worldId: this._id, characterId }, 'Associating new transport due to login for existing character');
                            existingChar.transport = client;
                            existingChar.sendImmediate(existingChar.room.toRoomDetailsMessage(existingChar.id));
                            return;
                        }
                        const characterModel = yield CharacterModel.findById(characterId);
                        if (!characterModel) {
                            log.warn({ worldId: this._id, characterId }, 'Could not find character');
                            client.send(JSON.stringify({ error: 'BadMessage', message: 'Unknown character' }));
                            return;
                        }
                        if (characterModel.isDead) {
                            log.info({ worldId: this._id, characterId }, 'Attempted to login dead character');
                            client.send(JSON.stringify({ error: 'BadMessage', message: 'Character is dead' }));
                            return;
                        }
                        log.debug({ worldId: this._id, characterId }, 'Logging in new Character');
                        const character = yield loadCharacter({ characterId, world: this });
                        character.transport = client;
                        character.sendImmediate(character.room.toRoomDetailsMessage(character.id));
                        this.addCharacter(character);
                    }
                }
                catch (e) {
                    log.warn({ worldId: this._id, message: e.message }, 'Failed to parse packet from client');
                    client.send(JSON.stringify({ error: 'BadMessage', message: e.message }));
                }
            }));
            client.on('close', (reason) => {
                log.info({ worldId: this._id, reason }, 'Client closed, disassociating transport from game world');
                const index = this.clients.indexOf(client);
                if (index > -1) {
                    this.clients.splice(index, 1);
                }
            });
        });
    }
    addCharacter(character) {
        this.characters.push(character);
        character.on('death', (character) => {
            const index = this.characters.indexOf(character);
            if (index > -1) {
                this.characters.splice(index, 1);
            }
        });
    }
    /**
     * Find an area by its ID
     *
     * @param {String} areaId - The area to lookup
     *
     * @return {Area} The area if found, or null
     */
    findAreaById(areaId) {
        return this.areas.find(a => a.id === areaId) || null;
    }
    /**
     * Find a room by its ID
     *
     * @param {String} roomId - The room to lookup
     *
     * @return {Room} The room if found, or null
     */
    findRoomById(roomId) {
        let room;
        for (const area of this.areas) {
            room = area.findRoomById(roomId);
            if (room) {
                break;
            }
        }
        return room || null;
    }
    /**
     * The main game loop callback
     *
     * This is called every N seconds (default 3) while the game is running. It
     * is responsible for causing the rest of the game to update periodically,
     * updating all the areas, rooms, and characters.
     */
    onTick() {
        return __awaiter(this, void 0, void 0, function* () {
            const start = Date.now();
            yield asyncForEach(this.areas, (area) => __awaiter(this, void 0, void 0, function* () {
                yield area.onTick();
            }));
            if (this.tickCounter % 20 === 0) {
                yield this.save();
            }
            const end = Date.now();
            const elapsedTime = end - start;
            log.debug({ worldId: this._id, tick: this.tickCounter, elapsedTime }, 'Processed game world');
            this.tickCounter += 1;
        });
    }
    /**
     * Load up the game world from the database models
     */
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            log.debug({ worldId: this._id }, 'Loading world...');
            const areaModels = yield AreaModel.find({});
            yield asyncForEach(areaModels, (areaModel) => __awaiter(this, void 0, void 0, function* () {
                const area = new Area(areaModel);
                yield area.load();
                this.areas.push(area);
            }));
            yield asyncForEach(this.areas, (area) => __awaiter(this, void 0, void 0, function* () {
                area.load('refs');
            }));
            // Parties are interesting because they need to be loaded after characters,
            // and they're technically global. So. Load them afterwards.
            const partyModels = yield PartyModel.find({});
            yield asyncForEach(partyModels, (partyModel) => __awaiter(this, void 0, void 0, function* () {
                const party = new Party(partyModel);
                // No need to store, as the parties will add themselves to their
                // own registry
                yield party.load();
            }));
        });
    }
    /**
     * Save the game world to the database models
     */
    save() {
        return __awaiter(this, void 0, void 0, function* () {
            log.debug({ worldId: this._id }, 'Saving world...');
            yield asyncForEach(this.areas, (area) => __awaiter(this, void 0, void 0, function* () {
                yield area.save();
            }));
            yield Party.save();
        });
    }
    /**
     * Shut down the world
     *
     * This will stop the polling handler.
     */
    shutdown() {
        return __awaiter(this, void 0, void 0, function* () {
            log.debug({ worldId: this._id }, 'Shutting down world...');
            clearInterval(this.tickHandle);
            this.tickHandle = null;
            // Destroy the singleton
            theWorld = null;
        });
    }
}
export default World;
