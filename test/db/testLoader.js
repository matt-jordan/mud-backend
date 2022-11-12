//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import loadObjects from '../../build/db/loader.js';
import AreaModel from '../../build/db/models/AreaModel.js';
import RoomModel from '../../build/db/models/RoomModel.js';


describe('loadObjects', () => {

  let definitions;

  beforeEach(() => {
    definitions = {
      areas: [
        {
          name: 'area-1',
          loadId: 'area-1',
          version: 1,
          roomLoadIds: ['room-1-1'],
        },
        {
          name: 'area-2',
          loadId: 'area-2',
          version: 1,
          roomLoadIds: ['room-2-1'],
        }
      ],
      rooms: [
        {
          name: 'room-1-1',
          areaLoadId: 'area-1',
          loadId: 'room-1-1',
          version: 1,
          exits: [{
            direction: 'east',
            loadId: 'room-2-1',
          }],
        },
        {
          name: 'room-2-1',
          areaLoadId: 'area-2',
          loadId: 'room-2-1',
          version: 1,
          exits: [{
            direction: 'west',
            loadId: 'room-1-1',
          }],
        },
      ],
    };
  });

  afterEach(async () => {
    await AreaModel.deleteMany();
    await RoomModel.deleteMany();
  });

  describe('creating', () => {
    afterEach(() => {
      definitions = null;
    });

    describe('on error', () => {
      [
        {
          scenario: 'Area property incorrect',
          setupFn: () => { delete definitions.areas[1].name; },
          validateFn: async (result) => {
            const area = await AreaModel.findByLoadId('area-2');
            assert(result === false);
            assert(area === null);
          },
        },
        {
          scenario: 'Area ref incorrect',
          setupFn: () => { definitions.areas[0].roomLoadIds[0] = 'nope'; },
          validateFn: async (result) => {
            assert(result === false);
          },
        },
        {
          scenario: 'Room property incorrect',
          setupFn: () => { delete definitions.rooms[0].name; },
          validateFn: async (result) => {
            const room = await RoomModel.findByLoadId('room-1-1');
            assert(result === false);
            assert(room === null);
          },
        },
        {
          scenario: 'Room area ref incorrect',
          setupFn: () => { definitions.rooms[1].areaLoadId = 'nope'; },
          validateFn: async (result) => {
            assert(result === false);
          },
        },
        {
          scenario: 'Room exit ref incorrect',
          setupFn: () => { definitions.rooms[0].exits[0].loadId = 'nope'; },
          validateFn: async (result) => {
            assert(result === false);
          },
        },
      ].forEach((scenarioDef) => {
        const { scenario, setupFn, validateFn } = scenarioDef;
        describe(`${scenario}`, () => {
          beforeEach(() => {
            setupFn();
          });
          it('fails', async () => {
            const result = await loadObjects(definitions);
            await validateFn(result);
          });
        });
      });
    });

    describe('when there are no errors', () => {
      it('loads all the definitions into the database', async () => {
        let area;
        let room1;
        let room2;

        const result = await loadObjects(definitions);
        assert(result);

        area = await AreaModel.findByLoadId('area-1');
        assert(area);
        assert(area.roomIds.length === 1);
        room1 = await RoomModel.findByLoadId('room-1-1');
        assert(room1);
        assert(room1.areaId.equals(area._id));
        assert(area.roomIds[0].equals(room1._id));

        area = await AreaModel.findByLoadId('area-2');
        assert(area);
        assert(area.roomIds.length === 1);
        room2 = await RoomModel.findByLoadId('room-2-1');
        assert(room2);
        assert(room2.areaId.equals(area._id));
        assert(area.roomIds[0].equals(room2._id));
        assert(room2.exits[0].destinationId.equals(room1._id));
        assert(room1.exits[0].destinationId.equals(room2._id));
      });
    });
  });

  describe('updating', () => {
    beforeEach(async () => {
      const area_1 = new AreaModel();
      area_1.name = 'old-area-1';
      area_1.loadInfo.version = 0;
      area_1.loadInfo.loadId = 'area-1';

      const area_2 = new AreaModel();
      area_2.name = 'old-area-2';
      area_2.loadInfo.version = 0;
      area_2.loadInfo.loadId = 'area-2';

      const room1_1 = new RoomModel();
      room1_1.areaId = area_1._id;
      room1_1.name = 'old-room-1-1';
      room1_1.loadInfo.version = 0;
      room1_1.loadInfo.loadId = 'room-1-1';

      const room2_1 = new RoomModel();
      room2_1.areaId = area_2._id;
      room2_1.name = 'old-room-2-1';
      room2_1.loadInfo.version = 0;
      room2_1.loadInfo.loadId = 'room-2-1';

      area_1.roomIds.push(room1_1._id);
      area_2.roomIds.push(room2_1._id);

      room1_1.exits.push({ direction: 'south', destinationId: room2_1._id });
      room2_1.exits.push({ direction: 'north', destinationId: room1_1._id });

      await area_1.save();
      await area_2.save();
      await room1_1.save();
      await room2_1.save();
    });

    describe('on error', () => {
      [
        {
          scenario: 'Area property incorrect',
          setupFn: () => { delete definitions.areas[1].name; },
          validateFn: async (result) => {
            assert(result === false);
          },
        },
        {
          scenario: 'Area ref incorrect',
          setupFn: () => { definitions.areas[0].roomLoadIds[0] = 'nope'; },
          validateFn: async (result) => {
            assert(result === false);
          },
        },
        {
          scenario: 'Room property incorrect',
          setupFn: () => { delete definitions.rooms[0].name; },
          validateFn: async (result) => {
            assert(result === false);
          },
        },
        {
          scenario: 'Room area ref incorrect',
          setupFn: () => { definitions.rooms[1].areaLoadId = 'nope'; },
          validateFn: async (result) => {
            assert(result === false);
          },
        },
        {
          scenario: 'Room exit ref incorrect',
          setupFn: () => { definitions.rooms[0].exits[0].loadId = 'nope'; },
          validateFn: async (result) => {
            assert(result === false);
          },
        },
      ].forEach((scenarioDef) => {
        const { scenario, setupFn, validateFn } = scenarioDef;
        describe(`${scenario}`, () => {
          beforeEach(() => {
            setupFn();
          });
          it('fails', async () => {
            const result = await loadObjects(definitions);
            await validateFn(result);
          });
        });
      });
    });

    describe('when there are no errors', () => {
      it('loads all the definitions into the database', async () => {
        let area;
        let room1;
        let room2;

        const result = await loadObjects(definitions);
        assert(result);

        area = await AreaModel.findByLoadId('area-1');
        assert(area);
        assert(area.roomIds.length === 1);
        assert(area.name === definitions.areas[0].name);
        room1 = await RoomModel.findByLoadId('room-1-1');
        assert(room1);
        assert(room1.areaId.equals(area._id));
        assert(room1.name === definitions.rooms[0].name);
        assert(area.roomIds[0].equals(room1._id));

        area = await AreaModel.findByLoadId('area-2');
        assert(area);
        assert(area.roomIds.length === 1);
        assert(area.name === definitions.areas[1].name);
        room2 = await RoomModel.findByLoadId('room-2-1');
        assert(room2);
        assert(room2.areaId.equals(area._id));
        assert(room2.name === definitions.rooms[1].name);
        assert(area.roomIds[0].equals(room2._id));

        assert(room1.exits[0].direction === definitions.rooms[0].exits[0].direction);
        assert(room2.exits[0].direction === definitions.rooms[1].exits[0].direction);
        assert(room2.exits[0].destinationId.equals(room1._id));
        assert(room1.exits[0].destinationId.equals(room2._id));
      });
    });
  });
});