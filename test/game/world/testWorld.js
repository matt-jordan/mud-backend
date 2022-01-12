import assert from 'power-assert';

import World from '../../../src/game/world/world.js';
import AreaModel from '../../../src/db/models/Area.js';
import RoomModel from '../../../src/db/models/Room.js';

describe('World', () => {

  let room1_2_id;
  let room2_2_id;

  beforeEach(async () => {
    const room1_1 = new RoomModel();
    room1_1.name = 'Room1_1';
    await room1_1.save();
    const room1_2 = new RoomModel();
    room1_2.name = 'Room1_2';
    await room1_2.save();

    room1_2_id = room1_2._id.toString();

    const area1 = new AreaModel();
    area1.name = 'TestArea1';
    area1.roomIds.push(room1_1._id);
    area1.roomIds.push(room1_2._id);
    await area1.save();

    const room2_1 = new RoomModel();
    room2_1.name = 'Room2_1';
    await room2_1.save();
    const room2_2 = new RoomModel();
    room2_2.name = 'Room2_2';
    await room2_2.save();

    room2_2_id = room2_2._id.toString();

    const area2 = new AreaModel();
    area2.name = 'TestArea2';
    area2.roomIds.push(room2_1._id);
    area2.roomIds.push(room2_2._id);
    await area2.save();
  });

  afterEach(async () => {
    await AreaModel.deleteMany();
    await RoomModel.deleteMany();
  });

  describe('World', () => {
    describe('load', () => {
      it('loads the world', async () => {
        const world = new World();
        await world.load();

        assert(world.areas.length === 2);
        assert(world.areas[0].rooms.length === 2);
        assert(world.areas[1].rooms.length === 2);
      });
    });

    describe('findRoomById', () => {
      it('returns a valid room', async () => {
        const world = new World();
        await world.load();

        const room1_2 = world.findRoomById(room1_2_id);
        assert(room1_2);
        assert(room1_2.id === room1_2_id);

        const room2_2 = world.findRoomById(room2_2_id);
        assert(room2_2);
        assert(room2_2.id === room2_2_id);
      });

      it('returns null when the room is invalid', async () => {
        const world = new World();
        await world.load();

        const room = world.findRoomById('unknown');
        assert(room === null);
      });
    });
  });
});