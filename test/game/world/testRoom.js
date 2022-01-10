import assert from 'power-assert';

import Room from '../../../src/game/world/room.js';

describe('Room', () => {

  let model;

  beforeEach(() => {
    model = {
      name: 'TestModel',
      description: 'A very long description',
      save: async () => {
        this._saveCalled = true;
      },
      _saveCalled: false,
    };
  });

  describe('load', () => {

    it('populates from the model', async () => {
      const uut = new Room(model);
      await uut.load();
      assert(uut.name === model.name);
      assert(uut.description === model.description);
    });

  });

  describe('save', () => {

    it('saves to the mode', async () => {
      const uut = new Room(model);
      uut.name = 'foo';
      uut.description = 'bar';
      await uut.save();
      assert(model.name === uut.name);
      assert(model.description === uut.description);
    });

  });

});