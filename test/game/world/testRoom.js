import assert from 'power-assert';

import Room from '../../../src/game/world/room.js';

describe('Room', () => {

  let model;

  beforeEach(() => {
    model = {
      _id: {
        toString: () => { return 'foobar'; },
      },
      name: 'TestModel',
      description: 'A very long description',
      save: async () => {
        this._saveCalled = true;
      },
      _saveCalled: false,
    };
  });

  describe('id', () => {
    it('returns the model id', () => {
      const uut = new Room(model);
      assert(uut.id === model._id.toString());
    });
  });

  describe('addCharacter', () => {
    let character;

    beforeEach(() => {
      character = {
        moveToRoomCalled: false,
        moveToRoom: function() {
          this.moveToRoomCalled = true;
        },
        toShortText: function () {
          return '';
        },
      };
    });

    it('calls adds the character to the room', () => {
      const uut = new Room(model);
      uut.addCharacter(character);
      assert(uut.characters.length === 1);
      assert(uut.characters[0].name === character.name);
    });

    it('prevents the character from being added twice', () => {
      const uut = new Room(model);
      uut.addCharacter(character);
      uut.addCharacter(character);
      assert(uut.characters.length === 1);
    });
  });

  describe('toText', () => {
    it('provides the basic description', async () => {
      const uut = new Room(model);
      await uut.load();
      const result = uut.toText();
      assert.match(result, /A very long description/);
      assert.match(result, /Exits: None/);
    });

    describe('with exits', () => {
      beforeEach(() => {
        model.exits = [];
        model.exits.push({
          direction: 'up',
          destinationId: 'somwhere-up',
        });
        model.exits.push({
          direction: 'north',
          destinationId: 'somewhere-north',
        });
      });

      it('provides a more full description', async () => {
        const uut = new Room(model);
        await uut.load();
        const result = uut.toText();
        assert.match(result, /A very long description/);
        assert.match(result, /Exits/);
        assert.match(result, /up/);
        assert.match(result, /north/);
      });
    });
  });

  describe('load', () => {
    it('populates from the model', async () => {
      const uut = new Room(model);
      await uut.load();
      assert(uut.name === model.name);
      assert(uut.description === model.description);
    });

    describe('with exits', () => {
      beforeEach(() => {
        model.exits = [];
        model.exits.push({
          direction: 'up',
          destinationId: 'somwhere-up',
        });
        model.exits.push({
          direction: 'north',
          destinationId: 'somewhere-north',
        });
      });

      it('adds exits', async () => {
        const uut = new Room(model);
        await uut.load();
        assert(uut.name === model.name);
        assert(uut.description === model.description);
        assert(uut.exits['up']);
        assert(uut.exits['north']);
      });
    });
  });

  describe('save', () => {
    it('saves to the model', async () => {
      const uut = new Room(model);
      uut.name = 'foo';
      uut.description = 'bar';
      await uut.save();
      assert(model.name === uut.name);
      assert(model.description === uut.description);
    });
  });

});