//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import Room from '../../../src/game/world/Room.js';
import RoomModel from '../../../src/db/models/RoomModel.js';
import Weapon from '../../../src/game/objects/Weapon.js';
import WeaponModel from '../../../src/db/models/WeaponModel.js';

describe('Room', () => {

  let model;

  beforeEach(async () => {
    model = new RoomModel();
    model.areaId = '61f0e305cc78a1eec321adda';
    model.name = 'TestModel';
    model.description = 'A very long description';
    await model.save();
  });

  afterEach(async () => {
    await RoomModel.deleteMany();
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

  describe('addItem', () => {
    let weapon;

    beforeEach(async () => {
      const weaponModel = new WeaponModel();
      weaponModel.name = 'test';
      weaponModel.weaponType = 'simple';
      weaponModel.damageType = 'piercing';
      await weaponModel.save();

      weapon = new Weapon(weaponModel);
      await weapon.load();
    });

    afterEach(async () => {
      await WeaponModel.deleteMany();
    });

    it('adds the item to the room', async () => {
      const uut = new Room(model);
      await uut.load();

      uut.addItem(weapon);
      assert(uut.inanimates.length === 1);
    });

    it('removes the item when it is destroyed', async () => {
      const uut = new Room(model);
      await uut.load();

      uut.addItem(weapon);
      assert(uut.inanimates.length === 1);
      await weapon.destroy();
      assert(uut.inanimates.length === 0);
    });
  });

  describe('removeItem', () => {
    let weapon;

    beforeEach(async () => {
      const weaponModel = new WeaponModel();
      weaponModel.name = 'test';
      weaponModel.weaponType = 'simple';
      weaponModel.damageType = 'piercing';
      await weaponModel.save();

      weapon = new Weapon(weaponModel);
      await weapon.load();
    });

    afterEach(async () => {
      await WeaponModel.deleteMany();
    });

    it('removes the item from the room', async () => {
      const uut = new Room(model);
      await uut.load();

      uut.addItem(weapon);
      assert(uut.inanimates.length === 1);
      uut.removeItem(weapon);
      assert(uut.inanimates.length === 0);
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
      beforeEach(async () => {
        model.exits = [];
        model.exits.push({
          direction: 'up',
          destinationId: '61f0e305cc78a1eec321addf',
        });
        model.exits.push({
          direction: 'north',
          destinationId: '61f0e305cc78a1eec321add1',
        });
        await model.save();
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
          name: 'TheDude',
          toShortText: () => 'TheDude',
        });
        uut.characters.push({
          id: '2',
          name: 'TheOtherDude',
          toShortText: () => 'TheOtherDude',
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
          destinationId: '61f0e305cc78a1eec321add2',
        });
        model.exits.push({
          direction: 'north',
          destinationId: '61f0e305cc78a1eec321add0',
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

  describe('sendImmediate', () => {
    it('it publishes the expected message to the topic', (done) => {
      const fakeCharacter = {
        id: 'fake'
      };
      const uut = new Room(model);
      const sub = uut.mb.subscribe(uut.id, (payload) => {
        assert(payload);
        assert(payload.senders.includes('fake'));
        assert(payload.text === 'Test message');
        done();
      });
      assert(sub);
      uut.sendImmediate([fakeCharacter], 'Test message');
    });
  });

  describe('load', () => {
    it('populates from the model', async () => {
      const uut = new Room(model);
      await uut.load();
      assert(uut.name === model.name);
      assert(uut.description === model.description);
    });

    describe('with inanimate objects', () => {
      beforeEach(async () => {
        const weapon = new WeaponModel();
        weapon.name = 'Test';
        weapon.description = 'A test weapon';
        weapon.weight = 2;
        weapon.minDamage = 10;
        weapon.maxDamage = 20;
        weapon.durability.current = 5;
        weapon.durability.base = 10;
        weapon.weaponType = 'simple';
        weapon.damageType = 'piercing';
        await weapon.save();

        model.inanimates.push({
          inanimateId: weapon._id,
          inanimateType: 'weapon',
        });
        await model.save();
      });

      afterEach(async () => {
        await WeaponModel.deleteMany();
      });

      it('loads everything', async () => {
        const uut = new Room(model);
        await uut.load();
        assert(uut.name === model.name);
        assert(uut.description === model.description);
        assert(uut.inanimates.length === 1);
      });
    });

    describe('with exits', () => {
      beforeEach(async () => {
        model.exits = [];
        model.exits.push({
          direction: 'up',
          destinationId: '61f0e305cc78a1eec321adda',
        });
        model.exits.push({
          direction: 'north',
          destinationId: '61f0e305cc78a1eec321adda',
        });
        await model.save();
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
    describe('with inanimates', () => {
      afterEach(async () => {
        await WeaponModel.deleteMany();
      });

      describe('when the inanimate does not exist', () => {
        it('saves to the model', async () => {
          const uut = new Room(model);
          await uut.load();

          const weaponModel = new WeaponModel();
          weaponModel.name = 'Test';
          weaponModel.description = 'A test weapon';
          weaponModel.weight = 2;
          weaponModel.minDamage = 10;
          weaponModel.maxDamage = 20;
          weaponModel.durability.current = 5;
          weaponModel.durability.base = 10;
          weaponModel.weaponType = 'simple';
          weaponModel.damageType = 'piercing';
          await weaponModel.save();

          const weapon = new Weapon(weaponModel);
          await weapon.load();
          uut.inanimates.addItem(weapon);
          await uut.save();

          const updatedModel = await RoomModel.findById(uut.id);
          assert(updatedModel);
          assert(updatedModel.inanimates.length === 1);
          assert(updatedModel.inanimates[0].inanimateId.equals(weaponModel._id));
        });
      });

      describe('when the inanimate exists', () => {
        beforeEach(async () => {
          const weapon = new WeaponModel();
          weapon.name = 'Test';
          weapon.description = 'A test weapon';
          weapon.weight = 2;
          weapon.minDamage = 10;
          weapon.maxDamage = 20;
          weapon.durability.current = 5;
          weapon.durability.base = 10;
          weapon.weaponType = 'simple';
          weapon.damageType = 'piercing';
          await weapon.save();

          model.inanimates.push({
            inanimateId: weapon._id,
            inanimateType: 'weapon',
          });
          await model.save();
        });

        it('saves to the model', async () => {
          const uut = new Room(model);
          await uut.load();
          uut.inanimates.all.length = 0;
          await uut.save();

          const updatedModel = await RoomModel.findById(uut.id);
          assert(updatedModel);
          assert(updatedModel.inanimates.length === 0);
        });
      });
    });

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