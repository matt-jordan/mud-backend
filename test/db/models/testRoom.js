import assert from 'power-assert';

import RoomModel from '../../../src/db/models/Room.js';

describe('RoomModel', () => {
  afterEach(async () => {
    await RoomModel.deleteMany();
  });

  describe('creating', () => {
    it('rejects if a room does not have a name', async () => {
      const uut = new RoomModel();
      assert.rejects(uut.save());
    });

    it('saves a valid room', async () => {
      const uut = new RoomModel();
      uut.name = 'sewers';
      await uut.save();
      assert(uut);
      assert(uut.name === 'sewers');
      assert(uut.description === '');
      assert(uut.characterIds.length === 0);
      assert(uut.inanimateIds.length === 0);
      assert(uut.exits.length === 0);
    });
  });
});
