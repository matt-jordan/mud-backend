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
const RoomModel_js_1 = __importDefault(require("../../db/models/RoomModel.js"));
const Room_js_1 = __importDefault(require("./Room.js"));
const asyncForEach_js_1 = __importDefault(require("../../lib/asyncForEach.js"));
const log_js_1 = __importDefault(require("../../lib/log.js"));
/**
 * @module game/world/Area
 */
/**
 * A class that is a container for associated rooms
 */
class Area {
    /**
     * Create a new area
     *
     * @param {AreaModel} model - The underlying database model for the area
     */
    constructor(model) {
        this.model = model;
        this._id = this.model._id.toString();
        this.name = 'Unloaded';
        this.rooms = [];
    }
    /**
     * A unique ID for this area
     *
     * @return {String}
     */
    get id() {
        return this._id;
    }
    /**
     * Find a room by its ID
     *
     * @param {String} roomId - The ID of the room to retriev
     *
     * @returns {Room} A room if found, or null
     */
    findRoomById(roomId) {
        const room = this.rooms.find((room) => room.id === roomId);
        return room || null;
    }
    /**
     * Main game loop update handler
     *
     * Called by the containing World whenever the game loop updates
     */
    async onTick() {
        await (0, asyncForEach_js_1.default)(this.rooms, async (room) => {
            await room.onTick();
        });
    }
    /**
     * Load the area from the database
     *
     * @param {String} [loadSet] - optional. Which pass we're doing on our refs.
     */
    async load(loadSet) {
        if (!loadSet) {
            this.name = this.model.name;
            log_js_1.default.debug({ areaName: this.name }, 'Loading area');
            await (0, asyncForEach_js_1.default)(this.model.roomIds, async (roomId) => {
                const roomModel = await RoomModel_js_1.default.findById(roomId);
                const room = new Room_js_1.default(roomModel);
                await room.load();
                this.rooms.push(room);
            });
        }
        else if (loadSet === 'refs') {
            log_js_1.default.debug({ areaName: this.name }, 'Updating refs in area');
            await (0, asyncForEach_js_1.default)(this.rooms, async (room) => {
                await room.load('quests');
                await room.load('doors');
                await room.load('spawners');
            });
        }
    }
    /**
     * Save the area to its model/database
     */
    async save() {
        this.model.name = this.name;
        await (0, asyncForEach_js_1.default)(this.rooms, async (room) => {
            await room.save();
        });
        this.model.roomIds = this.rooms.map((room) => room.model._id);
        await this.model.save();
    }
}
exports.default = Area;
