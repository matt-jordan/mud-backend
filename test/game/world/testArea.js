//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';
import EventEmitter from 'events';

import Area from '../../../src/game/world/area.js';
import World from '../../../src/game/world/world.js';
import AreaModel from '../../../src/db/models/Area.js';
import RoomModel from '../../../src/db/models/Room.js';

describe('Area', () => {

  let areaModel;
  let roomModel1;
  let roomModel2;

  beforeEach(async () => {
    World.getInstance(new EventEmitter());

    areaModel = new AreaModel();
    areaModel.name = 'TestArea';
    await areaModel.save();

    roomModel1 = new RoomModel();
    roomModel1.name = 'TestRoom1';
    roomModel1.areaId = areaModel._id;
    await roomModel1.save();

    roomModel2 = new RoomModel();
    roomModel2.name = 'TestRoom2';
    roomModel2.areaId = areaModel._id;
    await roomModel2.save();
  });

  afterEach(async () => {
    await AreaModel.deleteMany();
    await RoomModel.deleteMany();
  });

  describe('findRoomById', () => {
    beforeEach(async () => {
      areaModel.roomIds.push(roomModel1._id);
      await areaModel.save();
    });

    it('returns a room when it is in the area', async () => {
      const uut = new Area(areaModel);
      await uut.load();

      const room = uut.findRoomById(roomModel1._id.toString());
      assert(room);
      assert(room.id === roomModel1._id.toString());
    });

    it('returns null when the room is not in the area', async () => {
      const uut = new Area(areaModel);
      await uut.load();

      const room = uut.findRoomById(roomModel2._id.toString());
      assert(room === null);
    });
  });

  describe('onTick', () => {
    let room;

    beforeEach(() => {
      room = {
        onTickCalled: false,
        onTick: () => {
          room.onTickCalled = true;
        },
      };
    });

    it('calls onTick on its rooms', async () => {
      const uut = new Area(areaModel);
      await uut.load();
      uut.rooms.push(room);
      uut.onTick();
      assert(room.onTickCalled);
    });

  });

  describe('load', () => {

    it('sets basic properties', async () => {
      const uut = new Area(areaModel);
      await uut.load();
      assert(uut.name === areaModel.name);
    });

    describe('with rooms', () => {
      beforeEach(async () => {
        areaModel.roomIds.push(roomModel1._id);
        areaModel.roomIds.push(roomModel2._id);
        await areaModel.save();
      });

      it('loads the rooms', async () => {
        const uut = new Area(areaModel);
        await uut.load();
        assert(uut.rooms.length === 2);
        assert(uut.name === areaModel.name);
        assert(uut.rooms[0].name === roomModel1.name);
        assert(uut.rooms[1].name === roomModel2.name);
      });
    });
  });
});