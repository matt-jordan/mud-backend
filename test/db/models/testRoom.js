import assert from 'power-assert';
import mongoose from 'mongoose';

import RoomModel from '../../../src/db/models/Room.js';

describe('RoomModel', () => {
  afterEach(async () => {
    await RoomModel.deleteMany();
  });

  describe('creating', () => {
    it('rejects if a room does not have a name', async () => {
      const uut = new RoomModel();
      uut.areaId = new mongoose.Types.ObjectId();
      assert.rejects(uut.save());
    });

    it('rejects if a room does not have an areaId', async () => {
      const uut = new RoomModel();
      uut.name = 'sewers';
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
      assert(uut.inanimateIds.length === 0);
      assert(uut.exits.length === 0);
    });
  });
});
