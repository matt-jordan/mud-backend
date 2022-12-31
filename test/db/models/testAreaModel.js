//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import AreaModel from '../../../src/db/models/AreaModel';
import RoomModel from '../../../src/db/models/RoomModel';

describe('AreaModel', () => {
  afterEach(async () => {
    await AreaModel.deleteMany();
  });

  describe('creating', () => {
    it('rejects if there is no name', async () => {
      const uut = new AreaModel();
      assert.rejects(uut.save());
    });

    it('saves if there is a name', async () => {
      const uut = new AreaModel();
      uut.name = 'sewers';
      await uut.save();
      assert(uut);
      assert(uut.name === 'sewers');
      assert(uut.roomIds.length === 0);
    });
  });

  describe('findByLoadId', () => {
    beforeEach(async () => {
      const area = new AreaModel();
      area.name = 'foo';
      area.loadInfo.version = 0;
      area.loadInfo.loadId = 'area-1';
      await area.save();
    });

    it('returns null if the area is not found', async () => {
      const uut = await AreaModel.findByLoadId('area-2');
      assert(uut === null);
    });

    it('returns the area if it is found', async () => {
      const uut = await AreaModel.findByLoadId('area-1');
      assert(uut);
      assert(uut.name === 'foo');
    });
  });

  describe('updateFromLoad', () => {
    let area;

    beforeEach(async () => {
      area = new AreaModel();
      area.name = 'foo';
      area.loadInfo.version = 0;
      area.loadInfo.loadId = 'area-1';
      await area.save();
    });

    it('does not update if the version is not later', async () => {
      const uut = {
        name: 'bar',
        version: 0,
        loadId: 'area-1',
      };
      await area.updateFromLoad(uut);
      assert(area.name !== uut.name);
    });

    it('does not update if the loadId does not match', async () => {
      const uut = {
        name: 'bar',
        version: 1,
        loadId: 'area-2',
      };
      await area.updateFromLoad(uut);
      assert(area.name !== uut.name);
    });

    it('updates the non-ref properties', async () => {
      const uut = {
        name: 'bar',
        version: 1,
        loadId: 'area-1',
      };
      await area.updateFromLoad(uut);
      assert(area.name === uut.name);
    });
  });

  describe('updateFromLoadRefs', () => {
    let area;

    beforeEach(async () => {
      area = new AreaModel();
      area.name = 'foo';
      area.loadInfo.version = 0;
      area.loadInfo.loadId = 'area-1';
      await area.save();

      const room = new RoomModel();
      room.name = 'room-1';
      room.areaId = area._id;
      room.loadInfo.version = 0;
      room.loadInfo.loadId = 'room-1';
      await room.save();
    });

    afterEach(async () => {
      RoomModel.deleteMany();
    });

    it('does not update if the version is not later', async () => {
      const uut = {
        loadId: 'area-1',
        version: 0,
        roomLoadIds: [ 'room-1' ],
      };
      await area.updateFromLoadRefs(uut);
      assert(area.roomIds.length === 0);
    });

    it('does not update if the loadId does not match', async () => {
      const uut = {
        loadId: 'area-2',
        version: 1,
        roomLoadIds: [ 'room-1' ],
      };
      await area.updateFromLoadRefs(uut);
      assert(area.roomIds.length === 0);
    });

    it('throws an error if a referenced room does not exist', async () => {
      const uut = {
        loadId: 'area-1',
        version: 1,
        roomLoadIds: [ 'room-2' ],
      };
      let caught = false;
      try {
        await area.updateFromLoadRefs(uut);
      } catch {
        caught = true;
      }
      assert(caught);
    });

    it('updates the ref properties', async () => {
      const uut = {
        loadId: 'area-1',
        version: 1,
        roomLoadIds: [ 'room-1' ],
      };
      await area.updateFromLoadRefs(uut);
      assert(area.roomIds.length === 1);
    });
  });
});