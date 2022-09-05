//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

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
  async onTick() {
    await asyncForEach(this.rooms, async (room) => {
      await room.onTick();
    });
  }

  /**
   * Load the area from the database
   */
  async load() {
    this.name = this.model.name;
    log.debug({ areaName: this.name }, 'Loading area');

    await asyncForEach(this.model.roomIds, async (roomId) => {
      const roomModel = await RoomModel.findById(roomId);
      const room = new Room(roomModel);
      await room.load(0);
      this.rooms.push(room);
    });

    await asyncForEach(this.rooms, async (room) => {
      await room.load(1);
    });
  }

  /**
   * Save the area to its model/database
   */
  async save() {
    this.model.name = this.name;
    await asyncForEach(this.rooms, async (room) => {
      await room.save();
    });
    this.model.roomIds = this.rooms.map((room) => room.model._id);
    await this.model.save();
  }
}

export default Area;
