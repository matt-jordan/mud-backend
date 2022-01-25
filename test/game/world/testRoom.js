//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

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
      },
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

  describe('toRoomDetailsMessage', () => {
    it('converts the room to the expected JSON message', async () => {
      const uut = new Room(model);
      await uut.load();

      const json = uut.toRoomDetailsMessage();
      assert(json);
      assert(json.messageType === 'RoomDetails');
      assert(json.summary === model.name);
      assert(json.description === model.description);
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

      it('converts the room to the expected JSON message', async () => {
        const uut = new Room(model);
        await uut.load();

        const json = uut.toRoomDetailsMessage();
        assert(json);
        assert(json.messageType === 'RoomDetails');
        assert(json.summary === model.name);
        assert(json.description === model.description);
        assert(json.exits.length === 2);
        assert(json.exits[0].direction === 'up');
        assert(json.exits[1].direction === 'north');
      });
    });

    describe('with characters', () => {
      it('converts the room to the expected JSON message', async () => {
        const uut = new Room(model);
        await uut.load();
        uut.characters.push({
          id: '1',
          name: 'TheDude'
        });
        uut.characters.push({
          id: '2',
          name: 'TheOtherDude'
        });

        const json = uut.toRoomDetailsMessage('2');
        assert(json);
        assert(json.messageType === 'RoomDetails');
        assert(json.summary === model.name);
        assert(json.description === model.description);
        assert(json.characters.length === 1);
        assert(json.characters[0].summary === 'TheDude');
      });
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

  describe('onTick', () => {
    let character;

    beforeEach(() => {
      character = {
        onTickCalled: false,
        onTick: () => {
          character.onTickCalled = true;
        },
      };
    });

    it('calls onTick on the characters', async () => {
      const uut = new Room(model);
      await uut.load();
      uut.characters.push(character);
      uut.onTick();
      assert(character.onTickCalled);
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