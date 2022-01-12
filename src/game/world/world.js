import AreaModel from '../../db/models/Area.js';
import Area from './Area.js';

import asyncForEach from '../../lib/asyncForEach.js';
import log from '../../lib/log.js';

class World {
  constructor() {
    this.areas = [];
  }

  /**
   * Find a room by its ID
   *
   * @param roomId The room to lookup
   *
   * @return A Room object
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
   * Loads up the game world
   */
  async load() {
    log.debug('Loading world...');

    const areaModels = await AreaModel.find({});
    await asyncForEach(areaModels, async (areaModel) => {
      const area = new Area(areaModel);
      await area.load();

      this.areas.push(area);
    });
  }
}

export default World;