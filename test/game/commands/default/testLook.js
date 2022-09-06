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

import Door from '../../../../src/game/objects/Door.js';
import World from '../../../../src/game/world/World.js';
import Character from '../../../../src/game/characters/Character.js';
import CharacterModel from '../../../../src/db/models/CharacterModel.js';
import AreaModel from '../../../../src/db/models/AreaModel.js';
import DoorModel from '../../../../src/db/models/DoorModel.js';
import RoomModel from '../../../../src/db/models/RoomModel.js';
import ArmorModel from '../../../../src/db/models/ArmorModel.js';
import getOpposingDirection from '../../../../src/lib/getOpposingDirection.js';
import ringFactory from '../../../../src/game/objects/factories/ring.js';

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

    pc = new Character(characterModel, world);
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

      const pc2 = new Character(characterModel, world);
      await pc2.load();
    });

    describe('when the character is not in the game world', () => {
      it('tells the player that they do not see the player', async () => {
        const action = new LookAction({ target: 'Testy' });
        const messages = [];
        const transport = new FakeClient((msg) => {
          assert(msg);
          messages.push(msg);
        });
        pc.transport = transport;
        await action.execute(pc);
        assert(messages.length === 1);
        assert.match(messages[0], /You do not see a Testy here/);
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
        const action = new LookAction({ target: 'shirt' });
        const transport = new FakeClient((msg) => {
          assert(msg);
          assert.match(msg, /You do not see a shirt here/);
          done();
        });
        pc.transport = transport;
        action.execute(pc);
      });
    });

    describe('when the object exists', () => {
      describe('case sensitive', () => {
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

  describe('doors', () => {
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
      describe(`${direction}`, () => {
        beforeEach(async () => {
          const doorModel = new DoorModel();
          doorModel.name = 'door';
          doorModel.description = 'A test door. It looks heavy.';
          doorModel.isOpen = false;
          await doorModel.save();

          roomModel1.exits.push({
            direction,
            destinationId: roomModel2._id,
            doorId: doorModel._id,
          });
          roomModel2.exits.push({
            direction: getOpposingDirection(direction),
            destinationId: roomModel1._id,
            doorId: doorModel._id,
          });

          await roomModel1.save();
          await roomModel2.save();

          const room1 = world.findRoomById(roomModel1._id.toString());
          room1.model = roomModel1;
          await room1.load();
          const room2 = world.findRoomById(roomModel2._id.toString());
          room2.model = roomModel2;
          await room2.load();
        });

        afterEach(async () => {
          await DoorModel.deleteMany();
        });

        describe(`when looking at a door on ${direction}`, () => {
          it('provides a description', (done) => {
            const action = new LookAction({ target: 'door' });
            const transport = new FakeClient((msg) => {
              assert(msg);
              assert.match(msg, /A test door. It looks heavy/);
              done();
            });
            pc.transport = transport;
            action.execute(pc);
          });
        });

        describe('when a direction is specified but there is no door there', () => {
          it('tells you there is no door there', (done) => {
            const action = new LookAction({ target: `${getOpposingDirection(direction)}.door` });
            const transport = new FakeClient((msg) => {
              assert(msg);
              assert.match(msg, /You do not see a/);
              done();
            });
            pc.transport = transport;
            action.execute(pc);
          });
        });

        describe('when there are two doors with the same name on two directions', () => {
          beforeEach(async () => {
            const doorModel = new DoorModel();
            doorModel.name = 'door';
            doorModel.description = 'The real door.';
            doorModel.isOpen = false;
            await doorModel.save();

            roomModel1.exits.push({
              direction: getOpposingDirection(direction),
              destinationId: roomModel2._id,
              doorId: doorModel._id,
            });
            roomModel2.exits.push({
              direction: direction,
              destinationId: roomModel1._id,
              doorId: doorModel._id,
            });

            await roomModel1.save();
            await roomModel2.save();

            const room1 = world.findRoomById(roomModel1._id.toString());
            room1.model = roomModel1;
            await room1.load();
            const room2 = world.findRoomById(roomModel2._id.toString());
            room2.model = roomModel2;
            await room2.load();
          });

          it('picks the right door', (done) => {
            const action = new LookAction({ target: `${getOpposingDirection(direction)}.door` });
            const transport = new FakeClient((msg) => {
              assert(msg);
              assert.match(msg, /The real door/);
              done();
            });
            pc.transport = transport;
            action.execute(pc);
          });
        });
      });
    });
  });

  describe('directions', () => {
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
      describe(`when looking ${direction}`, () => {
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

        describe('when there is a door', () => {
          beforeEach(async () => {
            const doorModel = new DoorModel();
            doorModel.name = 'door';
            doorModel.isOpen = false;
            await doorModel.save();

            const door = new Door(doorModel);
            await door.load();

            const room1 = world.findRoomById(roomModel1._id.toString());
            room1.model = roomModel1;
            await room1.load();
            room1.exits[direction].door = door;
            const room2 = world.findRoomById(roomModel2._id.toString());
            room2.model = roomModel2;
            await room2.load();
            room2.exits[getOpposingDirection(direction)].door = door;
          });

          afterEach(async () => {
            await DoorModel.deleteMany();
          });

          describe('and the door is closed', () => {
            it('states you cannot see through doors', (done) => {
              const action = new LookAction({ direction });
              const transport = new FakeClient((msg) => {
                assert(msg);
                assert.match(msg, /TextMessage/);
                assert.match(msg, /You cannot look through door/);
                done();
              });
              pc.transport = transport;
              action.execute(pc);
            });
          });

          describe('and the door is open', () => {
            beforeEach(async () => {
              const room1 = world.findRoomById(roomModel1._id.toString());
              room1.exits[direction].door.isOpen = true;
            });

            it('returns a brief description', (done) => {
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

        describe('when there is no door', () => {
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
      // Return an error message
      assert(result);
      assert(result.message);
    });

    it('handles a bad direction', () => {
      const result = factory.generate(['what']);
      assert(result);
      assert(result.message);
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