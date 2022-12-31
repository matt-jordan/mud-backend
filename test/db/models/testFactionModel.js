//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import FactionModel from '../../../src/db/models/FactionModel.js';

describe('FactionModel', () => {
  afterEach(() => {
    FactionModel.deleteMany();
  });

  describe('creating', () => {
    it('rejects when there is no name', async () => {
      const uut = new FactionModel();
      await assert.rejects(uut.save());
    });

    it('creates the faction with expected defaults', async () => {
      const uut = new FactionModel();
      uut.name = 'kill all humans';
      await uut.save();
      assert(uut);
      assert(uut.name === 'kill all humans');
      assert(uut.positiveModifier === 1);
      assert(uut.negativeModifier === 1);
    });
  });

  describe('loading external objects', () => {
    let existingObject;

    beforeEach(async () => {
      existingObject = new FactionModel();
      existingObject.name = 'test faction';
      existingObject.loadInfo.loadId = 'test-faction';
      existingObject.loadInfo.version = 0;
      await existingObject.save();
    });

    afterEach(() => {
      existingObject = null;
    });

    describe('findByLoadId', () => {
      it('returns null if the object does not exist', async () => {
        const uut = await FactionModel.findByLoadId('does-not-exist');
        assert(uut === null);
      });

      it('returns the room by loadId if it exists', async () => {
        const uut = await FactionModel.findByLoadId('test-faction');
        assert(uut);
        assert(uut.loadInfo.loadId === 'test-faction');
      });
    });

    describe('updateFromLoad', () => {
      let loadObj;
      beforeEach(() => {
        loadObj = {
          version: 1,
          loadId: 'test-faction',
          name: 'update',
          positiveModifier: 100,
          negativeModifier: 100,
          supportingFactions: [ 'foo' ],
          opposingFactions: [ 'bar' ],
        };
      });

      afterEach(() => {
        loadObj = null;
      });

      it('skips the update if the version is not higher', async () => {
        loadObj.version = 0;
        await existingObject.updateFromLoad(loadObj);
        assert(existingObject.name !== loadObj.name);
      });

      it('skips the update if the loadId does not match', async () => {
        loadObj.loadId = 'test-faction-doobie-doo';
        await existingObject.updateFromLoad(loadObj);
        assert(existingObject.name !== loadObj.name);
      });

      it('loads the properties into the FactionModel', async () => {
        await existingObject.updateFromLoad(loadObj);
        assert(existingObject.name === loadObj.name);
        assert(existingObject.positiveModifier === loadObj.positiveModifier);
        assert(existingObject.negativeModifier === loadObj.negativeModifier);
        assert(existingObject.supportingFactions.length === loadObj.supportingFactions.length);
        assert(existingObject.supportingFactions[0] === loadObj.supportingFactions[0]);
        assert(existingObject.opposingFactions.length === loadObj.opposingFactions.length);
        assert(existingObject.opposingFactions[0] === loadObj.opposingFactions[0]);
      });
    });
  });

});