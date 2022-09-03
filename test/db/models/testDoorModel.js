//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import DoorModel from '../../../src/db/models/DoorModel.js';

describe('DoorModel', () => {
  afterEach(() => {
    DoorModel.deleteMany();
  });

  describe('creating', () => {
    it('rejects when there is no name', async () => {
      const uut = new DoorModel();
      await assert.rejects(uut.save());
    });

    it('creates the door with expected defaults', async () => {
      const uut = new DoorModel();
      uut.name = 'big door';
      await uut.save();
      assert(uut);
      assert(uut.name === 'big door');
      assert(uut.isOpen === false);
      assert(uut.hasLock === false);
      assert(uut.lockInfo.isLocked === false);
      assert(uut.lockInfo.skillDC === 0);
      assert(uut.weight === 75);
      assert(uut.durability.current === 25);
      assert(uut.durability.base === 25);
    });

    it('creates the door with all props', async () => {
      const uut = new DoorModel();
      uut.name = 'big door';
      uut.description = 'A really big door';
      uut.isOpen = true;
      uut.hasLock = true;
      uut.lockInfo.isLocked = false;
      uut.lockInfo.skillDC = 100;
      uut.lockInfo.inanimateId = 'foo';
      uut.weight = 100;
      uut.durability.current = 100;
      uut.durability.base = 100;
      await uut.save();
      assert(uut);
      assert(uut.name === 'big door');
      assert(uut.description === 'A really big door');
      assert(uut.isOpen === true);
      assert(uut.hasLock === true);
      assert(uut.lockInfo.isLocked === false);
      assert(uut.lockInfo.skillDC === 100);
      assert(uut.lockInfo.inanimateId === 'foo');
      assert(uut.weight === 100);
      assert(uut.durability.current === 100);
      assert(uut.durability.base === 100);
    });
  });

  describe('loading external objects', () => {
    let existingObject;

    beforeEach(async () => {
      existingObject = new DoorModel();
      existingObject.name = 'test door';
      existingObject.loadInfo.loadId = 'test-door';
      existingObject.loadInfo.version = 0;
      await existingObject.save();
    });

    afterEach(() => {
      existingObject = null;
    });

    describe('findByLoadId', () => {
      it('returns null if the object does not exist', async () => {
        const uut = await DoorModel.findByLoadId('does-not-exist');
        assert(uut === null);
      });

      it('returns the room by loadId if it exists', async () => {
        const uut = await DoorModel.findByLoadId('test-door');
        assert(uut);
        assert(uut.loadInfo.loadId === 'test-door');
      });
    });

    describe('updateFromLoad', () => {
      let loadObj;
      beforeEach(() => {
        loadObj = {
          version: 1,
          loadId: 'test-door',
          name: 'update',
          description: 'foo',
          hasLock: true,
          skillDC: 100,
          inanimateId: 'foobar',
          weight: 10,
          durability: 1000,
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

      it('loads the properties into the DoorModel', async () => {
        await existingObject.updateFromLoad(loadObj);
        assert(existingObject.name === loadObj.name);
        assert(existingObject.description === loadObj.description);
        assert(existingObject.hasLock === loadObj.hasLock);
        assert(existingObject.lockInfo.skillDC === loadObj.skillDC);
        assert(existingObject.lockInfo.inanimateId === loadObj.inanimateId);
        assert(existingObject.weight === loadObj.weight);
        assert(existingObject.durability.base === loadObj.durability);
        assert(existingObject.durability.current === loadObj.durability);
      });
    });
  });

});