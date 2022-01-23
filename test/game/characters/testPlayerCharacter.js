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

import World from '../../../src/game/world/world.js';
import PlayerCharacter from '../../../src/game/characters/playerCharacter.js';
import CharacterModel from '../../../src/db/models/Character.js';
import AreaModel from '../../../src/db/models/Area.js';
import RoomModel from '../../../src/db/models/Room.js';

const ObjectId = mongoose.Schema.ObjectId;

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

class FakeCommand {
  constructor(cb) {
    this.cb = cb;
  }

  async execute(pc) {
    if (this.cb) {
      this.cb(pc);
    }
  }
}

class FakeCommandSet {
  constructor(command) {
    this.command = command;
  }

  generate() {
    return this.command;
  }
}

describe('PlayerCharacter', () => {
  let characterModel;
  let world;
  let roomModel1;
  let roomModel2;

  beforeEach(async () => {
    const areaModel = new AreaModel();
    areaModel.name = 'TestArea';

    roomModel1 = new RoomModel();
    roomModel1.name = 'TestRoom1';
    roomModel1.areaId = areaModel._id;
    await roomModel1.save();

    roomModel2 = new RoomModel();
    roomModel2.name = 'TestRoom2';
    roomModel2.areaId = areaModel._id;
    await roomModel2.save();

    areaModel.roomIds.push(roomModel1._id);
    areaModel.roomIds.push(roomModel2._id);
    await areaModel.save();

    const fakeTransport = new EventEmitter();
    world = new World(fakeTransport);
    await world.load();

    characterModel = new CharacterModel();
    characterModel.name = 'TestCharacter';
    characterModel.accountId = new mongoose.Types.ObjectId();
    characterModel.description = 'A complete character';
    characterModel.age = 30;
    characterModel.gender = 'non-binary';
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

  describe('constructor', () => {
    it('initializes to defaults', () => {
      const uut = new PlayerCharacter(characterModel, world);
      assert(uut);
      assert(uut.name === 'Unknown');
    });
  });

  describe('id', () => {
    it('returns the expected unique id', () => {
      const uut = new PlayerCharacter(characterModel, world);
      assert(uut);
      assert(uut.id === characterModel._id.toString());
    });
  });

  describe('toShortText', () => {
    it('returns the expected string', () => {
      const uut = new PlayerCharacter(characterModel, world);
      assert(uut);
      assert(uut.toShortText() === uut.name);
    });
  });

  describe('transport', () => {
    describe('set', () => {
      it('sets the transport to null on disconnect', () => {
        const uut = new PlayerCharacter(characterModel, world);
        const transport = new FakeClient();
        uut.transport = transport;
        transport.emit('disconnect');
        assert(uut.transport === null);
      });

      it('swaps and closes the transport if a new one is set', () => {
        const uut = new PlayerCharacter(characterModel, world);
        const transport1 = new FakeClient();
        const transport2 = new FakeClient();
        uut.transport = transport1;
        uut.transport = transport2;
        assert(transport1.closed);
        assert(uut.transport === transport2);
      });
    });

    describe('message handling', () => {
      it('handles a badly formatted message', () => {
        const uut = new PlayerCharacter(characterModel, world);
        const transport = new FakeClient();
        uut.transport = transport;
        transport.emit('message', 'i am not real');
        // Lack of an Error here is success
      });

      it('handles a valid JSON blob with no messageType', () => {
        const uut = new PlayerCharacter(characterModel, world);
        const transport = new FakeClient();
        uut.transport = transport;
        transport.emit('message', '{ "test": "foo" }');
        // Lack of an Error here is success
      });

      it('parses a message into a command', (done) => {
        const fakeCommand = new FakeCommand((pc) => {
          assert(pc);
          done();
        });
        const fakeCommandSet = new FakeCommandSet(fakeCommand);
        const transport = new FakeClient();
        const uut = new PlayerCharacter(characterModel, world);
        uut.commandSets.push(fakeCommandSet);
        uut.transport = transport;
        transport.emit('message', '{ "messageType": "fakeCommand" }');
      });
    });
  });

  describe('sendImmediate', () => {
    it('bails if there is no transport', () => {
      const uut = new PlayerCharacter(characterModel, world);
      assert(!uut._transport);
      uut.sendImmediate('foobar');
    });

    it('sends the object directly', (done) => {
      const uut = new PlayerCharacter(characterModel, world);
      uut.transport = new FakeClient((msg) => {
        assert(msg === '{"test":"foobar"}');
        done();
      });
      uut.sendImmediate({ test: 'foobar' });
    });

    describe('TextMessage', () => {
      it('sends it if the value is a string', (done) => {
        const uut = new PlayerCharacter(characterModel, world);
        uut.transport = new FakeClient((msg) => {
          assert(msg === '{"messageType":"TextMessage","message":"foobar"}');
          done();
        });
        uut.sendImmediate('foobar');
      });

      it('sends it if the value is a number', (done) => {
        const uut = new PlayerCharacter(characterModel, world);
        uut.transport = new FakeClient((msg) => {
          assert(msg === '{"messageType":"TextMessage","message":"3"}');
          done();
        });
        uut.sendImmediate('3');
      });
    });
  });

  describe('load', () => {
    describe('without a room', () => {
      it('loads the character', async () => {
        const uut = new PlayerCharacter(characterModel, world);
        await uut.load();
        assert(uut.name === characterModel.name);
        assert(uut.accountId = characterModel.accountId);
        assert(uut.description === characterModel.description);
        assert(uut.age === characterModel.age);
        assert(uut.gender === characterModel.gender);
        assert(uut.attributes.strength.base === characterModel.attributes.strength.base);
        assert(uut.attributes.strength.current === characterModel.attributes.strength.base);
        assert(uut.attributes.dexterity.base === characterModel.attributes.dexterity.base);
        assert(uut.attributes.dexterity.current === characterModel.attributes.dexterity.base);
        assert(uut.attributes.constitution.base === characterModel.attributes.constitution.base);
        assert(uut.attributes.constitution.current === characterModel.attributes.constitution.base);
        assert(uut.attributes.intelligence.base === characterModel.attributes.intelligence.base);
        assert(uut.attributes.intelligence.current === characterModel.attributes.intelligence.base);
        assert(uut.attributes.wisdom.base === characterModel.attributes.wisdom.base);
        assert(uut.attributes.wisdom.current === characterModel.attributes.wisdom.base);
        assert(uut.attributes.charisma.base === characterModel.attributes.charisma.base);
        assert(uut.attributes.charisma.current === characterModel.attributes.charisma.base);
        assert(uut.attributes.hitpoints.base === characterModel.attributes.hitpoints.base);
        assert(uut.attributes.hitpoints.current === characterModel.attributes.hitpoints.current);
        assert(uut.attributes.manapoints.base === characterModel.attributes.manapoints.base);
        assert(uut.attributes.manapoints.current === characterModel.attributes.manapoints.current);
        assert(uut.attributes.energypoints.base === characterModel.attributes.energypoints.base);
        assert(uut.attributes.energypoints.current === characterModel.attributes.energypoints.current);
      });
    });

    describe('with a starting room', () => {
      it('loads and moves the character', async () => {
        characterModel.roomId = roomModel1._id;
        await characterModel.save();

        const uut = new PlayerCharacter(characterModel, world);
        await uut.load();
        assert(uut.name === characterModel.name);
        assert(uut.room);
        assert(uut.room.id === characterModel.roomId.toString());
        assert(uut.room.characters[0] === uut);
      });
    });
  });

  describe('save', () => {
    it('saves the properties', async () => {
      characterModel.roomId = roomModel1._id;
      await characterModel.save();

      const uut = new PlayerCharacter(characterModel, world);
      await uut.load();

      uut.room = roomModel2;
      uut.description = 'A new description';
      uut.attributes.energypoints.current = 1;
      uut.attributes.hitpoints.current = 1;
      uut.attributes.manapoints.current = 1;

      await uut.save();

      const newModel = await CharacterModel.findById(uut.id);
      assert(newModel);
      assert.match(newModel.description, /A new description/);
      assert(newModel.roomId.equals(uut.model.roomId));
      assert(newModel.attributes.energypoints.current === 1);
      assert(newModel.attributes.hitpoints.current === 1);
      assert(newModel.attributes.manapoints.current === 1);
    });
  });

});