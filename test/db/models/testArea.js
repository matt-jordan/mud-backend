import assert from 'power-assert';

import AreaModel from '../../../src/db/models/Area.js';

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
});