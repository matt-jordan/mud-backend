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

import { MoveFactory, MoveAction } from '../../../../build/game/commands/default/Move.js';

import World from '../../../../build/game/world/World.js';
import Character from '../../../../build/game/characters/Character.js';
import Door from '../../../../build/game/objects/Door.js';
import CharacterModel from '../../../../build/db/models/CharacterModel.js';
import AreaModel from '../../../../build/db/models/AreaModel.js';
import RoomModel from '../../../../build/db/models/RoomModel.js';
import DoorModel from '../../../../build/db/models/DoorModel.js';
import getOpposingDirection from '../../../../build/lib/getOpposingDirection.js';

class FakeClient extends EventEmitter {
  constructor(msgCb) {
    super();
    this.receivedMessage = null;
    this.closed = false;
    this.msgCb = msgCb;
    this.callCounter = 0;
  }

  send(message) {
    this.callCounter += 1;
    if (this.msgCb && !this.receivedMessage) {
      this.msgCb(message);
    }
    this.receivedMessage = message;
  }

  close() {
    this.closed = true;
  }
}

describe('MoveAction', () => {

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
      let world;
      let pc;
      let roomId1;
      let roomId2;

      beforeEach(async () => {
        const areaModel = new AreaModel();
        areaModel.name = 'TestArea';

        const roomModel1 = new RoomModel();
        roomModel1.name = 'TestRoom1';
        roomModel1.areaId = areaModel._id;
        roomId1 = roomModel1._id.toString();

        const roomModel2 = new RoomModel();
        roomModel2.name = 'TestRoom2';
        roomModel2.areaId = areaModel._id;
        roomId2 = roomModel2._id.toString();
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
      });

      afterEach(async () => {
        if (world) {
          await world.shutdown();
          world = null;
        }

        await CharacterModel.deleteMany();
        await AreaModel.deleteMany();
        await RoomModel.deleteMany();
      });

      describe('when there is a door but it is open', () => {
        beforeEach(async () => {
          const doorModel = new DoorModel();
          doorModel.name = 'door';
          doorModel.isOpen = true;
          await doorModel.save();

          const door = new Door(doorModel);
          await door.load();

          const room1 = world.findRoomById(roomId1);
          room1.exits[direction].door = door;
          const room2 = world.findRoomById(roomId2);
          room2.exits[getOpposingDirection(direction)].door = door;
        });

        afterEach(async () => {
          await DoorModel.deleteMany();
        });

        it('moves the character', (done) => {
          const action = new MoveAction({ direction });
          const transport = new FakeClient((msg) => {
            assert(msg);
            done();
          });
          pc.transport = transport;
          action.execute(pc);
        });
      });

      describe(`when blocked from moving ${direction}`, () => {
        beforeEach(async () => {
          const doorModel = new DoorModel();
          doorModel.name = 'door';
          doorModel.isOpen = false;
          await doorModel.save();

          const door = new Door(doorModel);
          await door.load();

          const room1 = world.findRoomById(roomId1);
          room1.exits[direction].door = door;
          const room2 = world.findRoomById(roomId2);
          room2.exits[getOpposingDirection(direction)].door = door;
        });

        afterEach(async () => {
          await DoorModel.deleteMany();
        });

        it('states that you cannot move in that direction', (done) => {
          const action = new MoveAction({ direction });
          const transport = new FakeClient((msg) => {
            assert(msg);
            assert.match(msg, /TextMessage/);
            assert.match(msg, /You cannot move through door/);
            done();
          });
          pc.transport = transport;
          action.execute(pc);
        });
      });

      describe(`when moving ${direction}`, () => {
        it('states that you cannot move in a direction when you cannot', (done) => {
          const otherDirection = getOpposingDirection(direction);
          const action = new MoveAction({ direction: otherDirection });
          const transport = new FakeClient((msg) => {
            assert(msg);
            assert.match(msg, /TextMessage/);
            assert.match(msg, /There is nothing in that direction/);
            done();
          });
          pc.transport = transport;
          action.execute(pc);
        });

        it('moves the character', (done) => {
          const action = new MoveAction({ direction });
          const transport = new FakeClient((msg) => {
            assert(msg);
            done();
          });
          pc.transport = transport;
          action.execute(pc);
        });

        describe('when in combat', () => {
          it('prevents you from moving', async () => {
            const action = new MoveAction({ direction });
            const currentRoom = pc.room;
            pc.room.combatManager.addCombat(pc, pc); // Strangely this will work for now
            await action.execute(pc);
            assert(currentRoom === pc.room);
          });
        });
      });
    });
  });
});

describe('MoveFactory', () => {
  describe('when generating an action', () => {

    let factory;
    beforeEach(() => {
      factory = new MoveFactory();
    });

    it('returns no action when it is given an empty token list', () => {
      const result = factory.generate([]);
      assert(result);
      assert(result.message);
    });

    it('handles an invalid direction', () => {
      const result = factory.generate(['where']);
      assert(result);
      assert(result.message);
    });

    it('handles an action that is too long', () => {
      const result = factory.generate(['north', 'now']);
      assert(result);
      assert(result.message);
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
      });
    });
  });
});