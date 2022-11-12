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
import RoomModel from '../../db/models/RoomModel.js';
import Room from './Room.js';
import asyncForEach from '../../lib/asyncForEach.js';
import log from '../../lib/log.js';
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
    onTick() {
        return __awaiter(this, void 0, void 0, function* () {
            yield asyncForEach(this.rooms, (room) => __awaiter(this, void 0, void 0, function* () {
                yield room.onTick();
            }));
        });
    }
    /**
     * Load the area from the database
     *
     * @param {String} [loadSet] - optional. Which pass we're doing on our refs.
     */
    load(loadSet) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!loadSet) {
                this.name = this.model.name;
                log.debug({ areaName: this.name }, 'Loading area');
                yield asyncForEach(this.model.roomIds, (roomId) => __awaiter(this, void 0, void 0, function* () {
                    const roomModel = yield RoomModel.findById(roomId);
                    const room = new Room(roomModel);
                    yield room.load();
                    this.rooms.push(room);
                }));
            }
            else if (loadSet === 'refs') {
                log.debug({ areaName: this.name }, 'Updating refs in area');
                yield asyncForEach(this.rooms, (room) => __awaiter(this, void 0, void 0, function* () {
                    yield room.load('quests');
                    yield room.load('doors');
                    yield room.load('spawners');
                }));
            }
        });
    }
    /**
     * Save the area to its model/database
     */
    save() {
        return __awaiter(this, void 0, void 0, function* () {
            this.model.name = this.name;
            yield asyncForEach(this.rooms, (room) => __awaiter(this, void 0, void 0, function* () {
                yield room.save();
            }));
            this.model.roomIds = this.rooms.map((room) => room.model._id);
            yield this.model.save();
        });
    }
}
export default Area;
