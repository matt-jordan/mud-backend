import mongoose from 'mongoose';
import assert from 'power-assert';
import EventEmitter from 'events';

import { LookFactory, LookAction } from '../../../../src/game/commands/default/Look.js';

import World from '../../../../src/game/world/world.js';
import PlayerCharacter from '../../../../src/game/characters/playerCharacter.js';
import CharacterModel from '../../../../src/db/models/Character.js';
import AreaModel from '../../../../src/db/models/Area.js';
import RoomModel from '../../../../src/db/models/Room.js';
import getOpposingDirection from '../../../../src/lib/getOpposingDirection.js';

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
      let world;
      let pc;

      beforeEach(async () => {
        const areaModel = new AreaModel();
        areaModel.name = 'TestArea';

        const roomModel1 = new RoomModel();
        roomModel1.name = 'TestRoom1';
        roomModel1.areaId = areaModel._id;

        const roomModel2 = new RoomModel();
        roomModel2.name = 'TestRoom2';
        roomModel2.areaId = areaModel._id;
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
        world = new World(fakeTransport);
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
      });

      afterEach(async () => {
        if (world) {
          world.shutdown();
          world = null;
        }

        await CharacterModel.deleteMany();
        await AreaModel.deleteMany();
        await RoomModel.deleteMany();
      });

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