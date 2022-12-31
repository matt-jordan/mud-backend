"use strict";
//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = __importDefault(require("config"));
const uuid_1 = require("uuid");
const AreaModel_js_1 = __importDefault(require("../../db/models/AreaModel.js"));
const SessionModel_js_1 = __importDefault(require("../../db/models/SessionModel.js"));
const CharacterModel_js_1 = __importDefault(require("../../db/models/CharacterModel.js"));
const PartyModel_js_1 = __importDefault(require("../../db/models/PartyModel.js"));
const loadCharacter_js_1 = __importDefault(require("../characters/loadCharacter.js"));
const Party_js_1 = __importDefault(require("../characters/party/Party.js"));
const asyncForEach_js_1 = __importDefault(require("../../lib/asyncForEach.js"));
const log_js_1 = __importDefault(require("../../lib/log.js"));
const Area_js_1 = __importDefault(require("./Area.js"));
/**
 * @module game/world/World
 */
// Consider moving this
async function authCheck(token) {
    const session = await SessionModel_js_1.default.findBySessionId(token);
    return session ? true : false;
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
        this._id = `world-${(0, uuid_1.v4)()}`;
        this.tickCounter = 0;
        this.tickHandle = setInterval(this.onTick.bind(this), config_1.default.game.tickInterval || 3000);
        log_js_1.default.debug({ worldId: this._id }, 'Created world');
        // In some test scenarios there may be no transport server. If so, just pass on.
        if (!this.transport) {
            return;
        }
        this.transport.on('connection', (client) => {
            this.clients.push(client);
            client.on('message', async (message) => {
                let packet;
                try {
                    packet = JSON.parse(message);
                    log_js_1.default.info({ packet });
                    const token = packet.auth;
                    if (!token || !await authCheck(token)) {
                        client.send(JSON.stringify({ error: 'Unauthorized', message: 'Unauthorized client' }));
                        client.close();
                        return;
                    }
                    // Handle login of characters here; all other messages we let the Character
                    // interpret and handle
                    if (packet.messageType === 'LoginCharacter') {
                        const characterId = packet.characterId;
                        if (!characterId) {
                            log_js_1.default.debug({ worldId: this._id }, 'No characterId provided with LoginCharacter command!');
                            client.send(JSON.stringify({ error: 'BadMessage', message: 'Missing characterId' }));
                            return;
                        }
                        // Make sure we don't log in characters twice
                        const existingChar = this.characters.find((c) => c.id === characterId);
                        if (existingChar) {
                            log_js_1.default.debug({ worldId: this._id, characterId }, 'Associating new transport due to login for existing character');
                            existingChar.transport = client;
                            existingChar.sendImmediate(existingChar.room.toRoomDetailsMessage(existingChar.id));
                            return;
                        }
                        const characterModel = await CharacterModel_js_1.default.findById(characterId);
                        if (!characterModel) {
                            log_js_1.default.warn({ worldId: this._id, characterId }, 'Could not find character');
                            client.send(JSON.stringify({ error: 'BadMessage', message: 'Unknown character' }));
                            return;
                        }
                        if (characterModel.isDead) {
                            log_js_1.default.info({ worldId: this._id, characterId }, 'Attempted to login dead character');
                            client.send(JSON.stringify({ error: 'BadMessage', message: 'Character is dead' }));
                            return;
                        }
                        log_js_1.default.debug({ worldId: this._id, characterId }, 'Logging in new Character');
                        const character = await (0, loadCharacter_js_1.default)({ characterId, world: this });
                        character.transport = client;
                        character.sendImmediate(character.room.toRoomDetailsMessage(character.id));
                        this.addCharacter(character);
                    }
                }
                catch (e) {
                    log_js_1.default.warn({ worldId: this._id, message: e.message }, 'Failed to parse packet from client');
                    client.send(JSON.stringify({ error: 'BadMessage', message: e.message }));
                }
            });
            client.on('close', (reason) => {
                log_js_1.default.info({ worldId: this._id, reason }, 'Client closed, disassociating transport from game world');
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
    async onTick() {
        const start = Date.now();
        await (0, asyncForEach_js_1.default)(this.areas, async (area) => {
            await area.onTick();
        });
        if (this.tickCounter % 20 === 0) {
            await this.save();
        }
        const end = Date.now();
        const elapsedTime = end - start;
        log_js_1.default.debug({ worldId: this._id, tick: this.tickCounter, elapsedTime }, 'Processed game world');
        this.tickCounter += 1;
    }
    /**
     * Load up the game world from the database models
     */
    async load() {
        log_js_1.default.debug({ worldId: this._id }, 'Loading world...');
        const areaModels = await AreaModel_js_1.default.find({});
        await (0, asyncForEach_js_1.default)(areaModels, async (areaModel) => {
            const area = new Area_js_1.default(areaModel);
            await area.load();
            this.areas.push(area);
        });
        await (0, asyncForEach_js_1.default)(this.areas, async (area) => {
            area.load('refs');
        });
        // Parties are interesting because they need to be loaded after characters,
        // and they're technically global. So. Load them afterwards.
        const partyModels = await PartyModel_js_1.default.find({});
        await (0, asyncForEach_js_1.default)(partyModels, async (partyModel) => {
            const party = new Party_js_1.default(partyModel);
            // No need to store, as the parties will add themselves to their
            // own registry
            await party.load();
        });
    }
    /**
     * Save the game world to the database models
     */
    async save() {
        log_js_1.default.debug({ worldId: this._id }, 'Saving world...');
        await (0, asyncForEach_js_1.default)(this.areas, async (area) => {
            await area.save();
        });
        await Party_js_1.default.save();
    }
    /**
     * Shut down the world
     *
     * This will stop the polling handler.
     */
    async shutdown() {
        log_js_1.default.debug({ worldId: this._id }, 'Shutting down world...');
        clearInterval(this.tickHandle);
        this.tickHandle = null;
        // Destroy the singleton
        theWorld = null;
    }
}
exports.default = World;
