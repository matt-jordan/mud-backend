//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import mongoose from 'mongoose';
import assert from 'power-assert';
import EventEmitter from 'events';

import { LookFactory, LookAction } from '../../../../src/game/commands/default/Look.js';

import World from '../../../../src/game/world/world.js';
import PlayerCharacter from '../../../../src/game/characters/playerCharacter.js';
import CharacterModel from '../../../../src/db/models/CharacterModel.js';
import AreaModel from '../../../../src/db/models/AreaModel.js';
import RoomModel from '../../../../src/db/models/RoomModel.js';
import ArmorModel from '../../../../src/db/models/ArmorModel.js';
import getOpposingDirection from '../../../../src/lib/getOpposingDirection.js';
import { ringFactory } from '../../../../src/game/objects/armor.js';

class FakeClient extends EventEmitter {
  constructor(msgCb) {
    super();
    this.receivedMessage = null;
    this.closed = false;
    this.msgCb = msgCb;
  }

  send(message) {
    if (this.msgCb && !this.receivedMessage) {
      this.msgCb(message);
    }
    this.receivedMessage = message;
  }

  close() {
    this.closed = true;
  }
}

describe('LookAction', () => {

  let world;
  let pc;
  let roomModel1;
  let roomModel2;

  beforeEach(async () => {
    const areaModel = new AreaModel();
    areaModel.name = 'TestArea';

    roomModel1 = new RoomModel();
    roomModel1.name = 'TestRoom1';
    roomModel1.areaId = areaModel._id;

    roomModel2 = new RoomModel();
    roomModel2.name = 'TestRoom2';
    roomModel2.areaId = areaModel._id;
    await roomModel1.save();
    await roomModel2.save();

    areaModel.roomIds.push(roomModel1._id);
    areaModel.roomIds.push(roomModel2._id);
    await areaModel.save();

    const fakeTransport = new EventEmitter();
    world = World.getInstance(fakeTransport);
    await world.load();

    const characterModel = new CharacterModel();
    characterModel.name = 'TestCharacter';
    characterModel.accountId = new mongoose.Types.ObjectId();
    characterModel.description = 'A complete character';
    characterModel.age = 30;
    characterModel.gender = 'non-binary';
    characterModel.roomId = roomModel1._id;
    characterModel.classes.push({
      type: 'fighter',
      level: 1,
      experience: 0,
    });
    characterModel.attributes = {
      strength: { base: 18, },
      dexterity: { base: 12, },
      constitution: { base: 14, },
      intelligence: { base: 12, },
      wisdom: { base: 8, },
      charisma: { base: 8, },
      hitpoints: { base: 6, current: 6, },
      manapoints: { base: 6, current: 6, },
      energypoints: { base: 10, current: 10, },
    };
    await characterModel.save();

    pc = new PlayerCharacter(characterModel, world);
    await pc.load();

    const ring1 = await ringFactory();
    pc.room.inanimates.addItem(ring1);
  });

  afterEach(async () => {
    if (world) {
      await world.shutdown();
      world = null;
    }

    await ArmorModel.deleteMany();
    await CharacterModel.deleteMany();
    await AreaModel.deleteMany();
    await RoomModel.deleteMany();
  });

  describe('characters', () => {
    beforeEach(async () => {
      const characterModel = new CharacterModel();
      characterModel.name = 'TestCharacter2';
      characterModel.accountId = new mongoose.Types.ObjectId();
      characterModel.description = 'A complete character as well';
      characterModel.age = 30;
      characterModel.gender = 'non-binary';
      characterModel.roomId = roomModel1._id;
      characterModel.classes.push({
        type: 'fighter',
        level: 1,
        experience: 0,
      });
      characterModel.attributes = {
        strength: { base: 18, },
        dexterity: { base: 12, },
        constitution: { base: 14, },
        intelligence: { base: 12, },
        wisdom: { base: 8, },
        charisma: { base: 8, },
        hitpoints: { base: 6, current: 6, },
        manapoints: { base: 6, current: 6, },
        energypoints: { base: 10, current: 10, },
      };
      await characterModel.save();

      const pc2 = new PlayerCharacter(characterModel, world);
      await pc2.load();
    });

    describe('when the character is not in the game world', () => {
      it('tells the player that they do not see the player', (done) => {
        const action = new LookAction({ target: 'Testy' });
        const transport = new FakeClient((msg) => {
          assert(msg);
          assert.match(msg, /You do not see a Testy here/);
          done();
        });
        pc.transport = transport;
        action.execute(pc);
      });
    });

    describe('when the character tries to look at themselves', () => {
      it('tells them they cannot look at themselves', (done) => {
        const action = new LookAction({ target: 'TestCharacter' });
        const transport = new FakeClient((msg) => {
          assert(msg);
          assert.match(msg, /You do not have a mirror/);
          done();
        });
        pc.transport = transport;
        action.execute(pc);
      });
    });

    describe('when the character is in the game world', () => {
      it('tells the player what they look like', (done) => {
        const action = new LookAction({ target: 'TestCharacter2' });
        const transport = new FakeClient((msg) => {
          assert(msg);
          assert.match(msg, /A complete character as well/);
          done();
        });
        pc.transport = transport;
        action.execute(pc);
      });
    });
  });

  describe('objects', () => {
    describe('when the object does not exist', () => {
      it('tells the player that they do not see it', (done) => {
        const action = new LookAction({ target: 'Shirt' });
        const transport = new FakeClient((msg) => {
          assert(msg);
          assert.match(msg, /You do not see a Shirt here/);
          done();
        });
        pc.transport = transport;
        action.execute(pc);
      });
    });

    describe('when the object exists', () => {
      describe('case sensitive', () => {
        it('returns a description', (done) => {
          const action = new LookAction({ target: 'Ring' });
          const transport = new FakeClient((msg) => {
            assert(msg);
            assert.match(msg, /A small metal band worn on a finger/);
            done();
          });
          pc.transport = transport;
          action.execute(pc);
        });
      });

      describe('case insensitive', () => {
        it('returns a description', (done) => {
          const action = new LookAction({ target: 'ring' });
          const transport = new FakeClient((msg) => {
            assert(msg);
            assert.match(msg, /A small metal band worn on a finger/);
            done();
          });
          pc.transport = transport;
          action.execute(pc);
        });
      });
    });
  });

  [
    'up',
    'down',
    'north',
    'east',
    'west',
    'south',
    'southeast',
    'southwest',
    'northeast',
    'northwest'
  ].forEach((direction) => {
    beforeEach(async () => {
      roomModel1.exits.push({
        direction,
        destinationId: roomModel2._id,
      });
      roomModel2.exits.push({
        direction: getOpposingDirection(direction),
        destinationId: roomModel1._id,
      });

      await roomModel1.save();
      await roomModel2.save();
    });

    describe(`when looking ${direction}`, () => {
      it('states that there is nothing in the direction when there isnt', (done) => {
        const otherDirection = getOpposingDirection(direction);
        const action = new LookAction({ direction: otherDirection });
        const transport = new FakeClient((msg) => {
          assert(msg);
          assert.match(msg, /TextMessage/);
          assert.match(msg, /There is nothing in that direction/);
          done();
        });
        pc.transport = transport;
        action.execute(pc);
      });

      it('returns a brief description when there is an exit', (done) => {
        const action = new LookAction({ direction });
        const transport = new FakeClient((msg) => {
          assert(msg);
          assert.match(msg, /TextMessage/);
          done();
        });
        pc.transport = transport;
        action.execute(pc);
      });
    });
  });
});

describe('LookFactory', () => {
  describe('when generating an action', () => {

    let factory;
    beforeEach(() => {
      factory = new LookFactory();
    });

    it('handles an empty token list', () => {
      const result = factory.generate([]);
      assert(result);
    });

    it('handles an action that is too long', () => {
      const result = factory.generate(['up', 'now']);
      assert(!result);
    });

    it('handles an object or person', () => {
      const result = factory.generate(['at', 'object']);
      assert(result);
      assert(result.target === 'object');
      assert(!result.direction);
    });

    it('handles a long object or person', () => {
      const result = factory.generate(['at', 'the', 'long', 'name']);
      assert(result);
      assert(result.target === 'the long name');
      assert(!result.direction);
    });

    [
      'up',
      'down',
      'north',
      'east',
      'west',
      'south',
      'southeast',
      'southwest',
      'northeast',
      'northwest'
    ].forEach((direction) => {
      it(`handles ${direction}`, () => {
        const result = factory.generate([ direction ]);
        assert(result);
        assert(result.direction === direction);
        assert(!result.target);
      });
    });
  });
});