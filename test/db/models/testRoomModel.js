//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';
import mongoose from 'mongoose';

import AreaModel from '../../../src/db/models/AreaModel.js';
import RoomModel from '../../../src/db/models/RoomModel.js';
import SpawnerModel from '../../../src/db/models/SpawnerModel.js';

describe('RoomModel', () => {
  afterEach(async () => {
    await RoomModel.deleteMany();
    await AreaModel.deleteMany();
  });

  describe('creating', () => {
    it('rejects if a room does not have a name', async () => {
      const uut = new RoomModel();
      uut.areaId = new mongoose.Types.ObjectId();
      assert.rejects(uut.save());
    });

    it('saves a valid room', async () => {
      const uut = new RoomModel();
      uut.name = 'sewers';
      uut.areaId = new mongoose.Types.ObjectId();
      await uut.save();
      assert(uut);
      assert(uut.areaId);
      assert(uut.name === 'sewers');
      assert(uut.description === '');
      assert(uut.characterIds.length === 0);
      assert(uut.inanimates.length === 0);
      assert(uut.exits.length === 0);
    });
  });

  describe('loading external objects', () => {
    let existingObject;
    let destinationRoom;
    let newDestinationRoom;
    let existingArea1;
    let existingArea2;

    beforeEach(async () => {
      existingArea1 = new AreaModel();
      existingArea1.name = 'area-1';
      existingArea1.loadInfo.loadId = 'area-1';
      await existingArea1.save();

      existingArea2 = new AreaModel();
      existingArea2.name = 'area-2';
      existingArea2.loadInfo.loadId = 'area-2';
      await existingArea2.save();

      destinationRoom = new RoomModel();
      destinationRoom.name = 'destination';
      destinationRoom.areaId = existingArea1._id;
      await destinationRoom.save();

      newDestinationRoom = new RoomModel();
      newDestinationRoom.name = 'new-destination';
      newDestinationRoom.loadInfo.loadId = 'new-destination';
      newDestinationRoom.areaId = existingArea1._id;
      await newDestinationRoom.save();

      existingObject = new RoomModel();
      existingObject.name = 'sewers';
      existingObject.areaId = existingArea1._id;
      existingObject.loadInfo.version = 0;
      existingObject.loadInfo.loadId = 'test-1';
      existingObject.exits = [{
        direction: 'east',
        destinationId: destinationRoom._id,
      }];
      await existingObject.save();
    });

    afterEach(() => {
      existingObject = null;
    });

    describe('findByLoadId', () => {
      it('returns null if the object does not exist', async () => {
        const uut = await RoomModel.findByLoadId('does-not-exist');
        assert(uut === null);
      });

      it('returns the room by loadId if it exists', async () => {
        const uut = await RoomModel.findByLoadId('test-1');
        assert(uut);
        assert(uut.loadInfo.loadId === 'test-1');
      });
    });

    describe('updateFromLoad', () => {
      let loadObj;
      beforeEach(() => {
        loadObj = {
          version: 1,
          loadId: 'test-1',
          name: 'update',
          description: 'foo',
        };
      });

      afterEach(() => {
        loadObj = null;
      });

      it('skips the update if the version is not higher', async () => {
        loadObj.version = 0;
        await existingObject.updateFromLoad(loadObj);
        assert(existingObject.name !== loadObj.name);
        assert(existingObject.description !== loadObj.description);
      });

      it('skips the update if the loadId does not match', async () => {
        loadObj.loadId = 'does-not-match';
        await existingObject.updateFromLoad(loadObj);
        assert(existingObject.name !== loadObj.name);
        assert(existingObject.description !== loadObj.description);
      });

      it('loads the properties into the roomModel', async () => {
        await existingObject.updateFromLoad(loadObj);
        assert(existingObject.name === loadObj.name);
        assert(existingObject.description === loadObj.description);
      });
    });

    describe('updateFromLoadRefs', () => {
      let loadObj;
      beforeEach(async () => {
        loadObj = {
          version: 1,
          loadId: 'test-1',
          name: 'update',
          description: 'foo',
          exits: []
        };

        const spawner = new SpawnerModel();
        spawner.characterFactories.push('RatFactory');
        spawner.loadInfo.loadId = 'real-spawner';
        spawner.loadInfo.version = 0;
        await spawner.save();
      });

      afterEach(() => {
        loadObj = null;
      });

      it('skips the update if the version is not higher', async () => {
        loadObj.version = 0;
        await existingObject.updateFromLoadRefs(loadObj);
        assert(existingObject.loadInfo.version === 0);
        assert(existingObject.exits.length === 1);
      });

      it('skips the update if the loadId does not match', async () => {
        loadObj.loadId = 'not-real';
        await existingObject.updateFromLoadRefs(loadObj);
        assert(existingObject.loadInfo.version === 0);
        assert(existingObject.exits.length === 1);
      });

      it('throws an exception if the area does not exist', async () => {
        loadObj.areaLoadId = 'what';
        let caught = false;
        try {
          await existingObject.updateFromLoadRefs(loadObj);
        } catch {
          caught = true;
        }
        assert(caught);
      });

      it('throws an exception if an exit references a room that does not exist', async () => {
        loadObj.exits.push({
          direction: 'north',
          loadId: 'not-real',
        });
        let caught = false;
        try {
          await existingObject.updateFromLoadRefs(loadObj);
        } catch {
          caught = true;
        }
        assert(caught);
      });

      it('throws an exception if a spawner is referenced that does not exist', async () => {
        loadObj.spawnerLoadIds = [];
        loadObj.spawnerLoadIds.push('not-real-spawner');
        let caught = false;
        try {
          await existingObject.updateFromLoadRefs(loadObj);
        } catch {
          caught = true;
        }
        assert(caught);
      });

      it('loads the properties into the roomModel', async () => {
        loadObj.areaLoadId = 'area-2';
        loadObj.exits.push({
          direction: 'northwest',
          loadId: 'new-destination',
        });
        loadObj.spawnerLoadIds = [];
        loadObj.spawnerLoadIds.push('real-spawner');
        await existingObject.updateFromLoadRefs(loadObj);
        assert(existingObject.exits.length === 1);
        assert(existingObject.exits[0].direction === 'northwest');
        assert(existingObject.exits[0].destinationId.equals(newDestinationRoom._id));
        assert(existingObject.areaId.equals(existingArea2._id));
        assert(existingObject.spawnerIds.length === 1);
      });
    });
  });
});
