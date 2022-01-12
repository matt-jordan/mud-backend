import RoomModel from '../../db/models/Room.js';
import Room from './room.js';

import asyncForEach from '../../lib/asyncForEach.js';
import log from '../../lib/log.js';


class Area {
  constructor(model) {
    this.model = model;
    this.name = 'Unloaded';
    this.rooms = [];
  }

  /**
   * Find a room by its ID
   *
   * @param roomId The ID of the room to retriev
   *
   * @returns Room if found, or null
   */
  findRoomById(roomId) {
    const room = this.rooms.find((room) => room.id === roomId);
    return room || null;
  }

  async load() {
    this.name = this.model.name;
    log.debug({ areaName: this.name }, 'Loading area');

    await asyncForEach(this.model.roomIds, async (roomId) => {
      const roomModel = await RoomModel.findById(roomId);
      const room = new Room(roomModel);
      await room.load();
      this.rooms.push(room);
    });
  }

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
