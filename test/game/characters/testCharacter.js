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

import World from '../../../src/game/world/World.js';
import Character from '../../../src/game/characters/Character.js';
import Armor from '../../../src/game/objects/Armor.js';
import maceFactory from '../../../src/game/objects/factories/mace.js';
import CharacterModel from '../../../src/db/models/CharacterModel.js';
import AreaModel from '../../../src/db/models/AreaModel.js';
import RoomModel from '../../../src/db/models/RoomModel.js';
import WeaponModel from '../../../src/db/models/WeaponModel.js';
import ArmorModel from '../../../src/db/models/ArmorModel.js';

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

describe('Character', () => {
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
    world = World.getInstance(fakeTransport);
    await world.load();

    characterModel = new CharacterModel();
    characterModel.name = 'TestCharacter';
    characterModel.description = 'A complete character';
    characterModel.age = 30;
    characterModel.gender = 'non-binary';
    characterModel.weight = 200;
    characterModel.size = 'giant';
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
    characterModel.defaultAttacks = [
      { minDamage: 0, maxDamage: 1, damageType: 'bludgeoning', verbs: { firstPerson: 'punch', thirdPerson: 'punches' }},
    ];
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
      const uut = new Character(characterModel, world);
      assert(uut);
      assert(uut.name === 'Unknown');
    });
  });

  describe('id', () => {
    it('returns the expected unique id', () => {
      const uut = new Character(characterModel, world);
      assert(uut);
      assert(uut.id === characterModel._id.toString());
    });
  });

  describe('toShortText', () => {
    it('returns the expected string', () => {
      const uut = new Character(characterModel, world);
      assert(uut);
      assert(uut.toShortText() === uut.name);
    });
  });

  describe('maxCarryWeight', () => {
    it('returns the expected value', () => {
      const uut = new Character(characterModel, world);
      assert(uut.maxCarryWeight === 150);
    });
  });

  describe('weight', () => {
    it('returns the expected value', () => {
      const uut = new Character(characterModel, world);
      assert(uut.weight === 200);
    });
  });

  describe('size', () => {
    it('returns the expected value', () => {
      const uut = new Character(characterModel, world);
      assert(uut.size === 'giant');
    });
  });

  describe('getAttributeModifier', () => {
    it('returns 0 if the attribute is not known', () => {
      const uut = new Character(characterModel, world);
      assert(uut.getAttributeModifier('whatever') === 0);
    });

    [['dexterity', 1], ['constitution', 2], ['strength', 4], ['intelligence', 1], ['wisdom', -1], ['charisma', -1]].forEach((attribute) => {
      describe(`${attribute[0]}`, () => {
        it('returns the expected value', async () => {
          const uut = new Character(characterModel, world);
          await uut.load();
          assert(uut.getAttributeModifier(attribute[0]) === attribute[1]);
        });
      });
    });
  });

  describe('applyDamange', () => {
    it('applies the damage to the character', async () => {
      const uut = new Character(characterModel, world);
      await uut.load();
      await uut.applyDamage(1);
      assert(uut.attributes.hitpoints.current === 5);
    });

    describe('if the character is an NPC', () => {
      it('kills the character off if needed', async () => {
        const uut = new Character(characterModel, world);
        await uut.load();
        const id = uut.id;
        uut.on('death', (char) => {
          assert(char);
        });
        await uut.applyDamage(1000);
        assert(uut.attributes.hitpoints.current === 0);
        assert(world.characters.length === 0);

        const updatedModel = await CharacterModel.findById(id);
        assert(updatedModel === null);
      });
    });

    describe('if the character is a playable character', () => {
      beforeEach(async () => {
        characterModel.accountId = new mongoose.Types.ObjectId();
        await characterModel.save();
      });

      it('kills the character off if needed', async () => {
        const uut = new Character(characterModel, world);
        await uut.load();
        const id = uut.id;
        uut.on('death', (char) => {
          assert(char);
        });
        await uut.applyDamage(1000);
        assert(uut.attributes.hitpoints.current === 0);
        assert(world.characters.length === 0);

        const updatedModel = await CharacterModel.findById(id);
        assert(updatedModel.isDead);
      });
    });
  });

  describe('attacks', () => {
    describe('if there are no weapons', () => {
      it('returns the default attack', async () => {
        const uut = new Character(characterModel, world);
        await uut.load();
        assert(uut.attacks.length === 1);
        assert(uut.attacks[0].minDamage === 0);
        assert(uut.attacks[0].maxDamage === 1);
        assert(uut.attacks[0].damageType === 'bludgeoning');
        assert(uut.attacks[0].verbs.firstPerson === 'punch');
        assert(uut.attacks[0].verbs.thirdPerson === 'punches');
      });
    });

    describe('with weapons', () => {
      let weapon;

      beforeEach(async () => {
        weapon = await maceFactory();
      });

      afterEach(async () => {
        await WeaponModel.deleteMany();
      });

      it('uses the weapon', async () => {
        const uut = new Character(characterModel, world);
        await uut.load();
        uut.physicalLocations.rightHand.item = weapon;
        const attacks = uut.attacks;
        assert(attacks.length === 1);
        assert(uut.attacks[0].minDamage === weapon.minDamage);
        assert(uut.attacks[0].maxDamage === weapon.maxDamage);
        assert(uut.attacks[0].damageType === weapon.model.damageType);
        assert(uut.attacks[0].name === weapon.name);
      });
    });
  });

  describe('transport', () => {
    describe('set', () => {
      it('sets the transport to null on disconnect', () => {
        const uut = new Character(characterModel, world);
        const transport = new FakeClient();
        uut.transport = transport;
        transport.emit('disconnect');
        assert(uut.transport === null);
      });

      it('swaps and closes the transport if a new one is set', () => {
        const uut = new Character(characterModel, world);
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
        const uut = new Character(characterModel, world);
        const transport = new FakeClient();
        uut.transport = transport;
        transport.emit('message', 'i am not real');
        // Lack of an Error here is success
      });

      it('handles a valid JSON blob with no messageType', () => {
        const uut = new Character(characterModel, world);
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
        const uut = new Character(characterModel, world);
        uut.commandSets.push(fakeCommandSet);
        uut.transport = transport;
        transport.emit('message', '{ "messageType": "fakeCommand" }');
      });
    });
  });

  describe('addHauledItem', () => {
    let backpack;

    beforeEach(async () => {
      const armorModel = new ArmorModel();
      armorModel.name = 'backpack';
      armorModel.isContainer = true;
      await armorModel.save();
      backpack = new Armor(armorModel);
      await backpack.load();
    });

    afterEach(async () => {
      await ArmorModel.deleteMany();
    });

    it('adjusts the character weight', async () => {
      const uut = new Character(characterModel, world);
      await uut.load();
      assert(uut.carryWeight === 0);
      uut.addHauledItem(backpack);
      assert(uut.carryWeight === 1);
    });

    describe('when the item has a weight change', () => {
      let otherItem;

      beforeEach(async () => {
        const armorModel = new ArmorModel();
        armorModel.name = 'otherItem';
        await armorModel.save();
        otherItem = new Armor(armorModel);
        await otherItem.load();
      });

      it('adjusts the character weight', async () => {
        const uut = new Character(characterModel, world);
        await uut.load();
        assert(uut.carryWeight === 0);
        uut.addHauledItem(backpack);
        assert(uut.carryWeight === 1);
        assert(backpack.addItem(otherItem) === true);
        assert(uut.carryWeight === 2);
      });
    });

    describe('when the item is destroyed', () => {
      it('is removed from the character', async () => {
        const uut = new Character(characterModel, world);
        await uut.load();
        uut.addHauledItem(backpack);
        assert(uut.inanimates.length === 1);
        await backpack.destroy();
        assert(uut.inanimates.length === 0);
      });
    });
  });

  describe('removeHauledItem', () => {
    let backpack;

    beforeEach(async () => {
      const armorModel = new ArmorModel();
      armorModel.name = 'backpack';
      await armorModel.save();
      backpack = new Armor(armorModel);
      await backpack.load();
    });

    afterEach(async () => {
      ArmorModel.deleteMany();
    });

    it('removes the carried weight', async () => {
      const uut = new Character(characterModel, world);
      await uut.load();
      assert(uut.carryWeight === 0);
      uut.addHauledItem(backpack);
      assert(uut.carryWeight === 1);
      uut.removeHauledItem(backpack);
      assert(uut.carryWeight === 0);
    });
  });

  describe('stand', () => {
    it('tells you if you are already fighting that you are already standing', (done) => {
      const uut = new Character(characterModel, world);
      uut.currentState = Character.STATE.FIGHTING;
      uut.transport = new FakeClient((msg) => {
        assert.match(msg, /You are already standing/);
        done();
      });
      uut.stand();
      assert(uut.currentState === Character.STATE.FIGHTING);
    });

    it('tells you that you are already standing if you are already standing', (done) => {
      const uut = new Character(characterModel, world);
      uut.currentState = Character.STATE.NORMAL;
      uut.transport = new FakeClient((msg) => {
        assert.match(msg, /You are already standing/);
        done();
      });
      uut.stand();
      assert(uut.currentState === Character.STATE.NORMAL);
    });

    it('stands you up if resting', (done) => {
      const uut = new Character(characterModel, world);
      uut.currentState = Character.STATE.RESTING;
      uut.transport = new FakeClient((msg) => {
        assert.match(msg, /You stand up/);
        done();
      });
      uut.stand();
      assert(uut.currentState === Character.STATE.NORMAL);
    });
  });

  describe('rest', () => {
    it('tells you if you are already resting', (done) => {
      const uut = new Character(characterModel, world);
      uut.currentState = Character.STATE.RESTING;
      uut.transport = new FakeClient((msg) => {
        assert.match(msg, /You are already resting/);
        done();
      });
      uut.rest();
      assert(uut.currentState === Character.STATE.RESTING);
    });

    it('tells you if you are fighting', (done) => {
      const uut = new Character(characterModel, world);
      uut.currentState = Character.STATE.FIGHTING;
      uut.transport = new FakeClient((msg) => {
        assert.match(msg, /you are fighting/);
        done();
      });
      uut.rest();
      assert(uut.currentState === Character.STATE.FIGHTING);
    });

    it('starts your rest', (done) => {
      const uut = new Character(characterModel, world);
      uut.currentState = Character.STATE.NORMAL;
      uut.transport = new FakeClient((msg) => {
        assert.match(msg, /You start resting/);
        done();
      });
      uut.rest();
      assert(uut.currentState === Character.STATE.RESTING);
    });
  });

  describe('sendImmediate', () => {
    it('bails if there is no transport', () => {
      const uut = new Character(characterModel, world);
      assert(!uut._transport);
      uut.sendImmediate('foobar');
    });

    it('sends the object directly', (done) => {
      const uut = new Character(characterModel, world);
      uut.transport = new FakeClient((msg) => {
        assert(msg === '{"test":"foobar"}');
        done();
      });
      uut.sendImmediate({ test: 'foobar' });
    });

    describe('TextMessage', () => {
      it('sends it if the value is a string', (done) => {
        const uut = new Character(characterModel, world);
        uut.transport = new FakeClient((msg) => {
          assert(msg === '{"messageType":"TextMessage","message":"foobar"}');
          done();
        });
        uut.sendImmediate('foobar');
      });

      it('sends it if the value is a number', (done) => {
        const uut = new Character(characterModel, world);
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
      beforeEach(async () => {
        characterModel.accountId = new mongoose.Types.ObjectId();
        await characterModel.save();
      });

      it('loads the character', async () => {
        const uut = new Character(characterModel, world);
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

        const uut = new Character(characterModel, world);
        await uut.load();
        assert(uut.name === characterModel.name);
        assert(uut.room);
        assert(uut.room.id === characterModel.roomId.toString());
        assert(uut.room.characters[0] === uut);
      });
    });

    describe('with equipment', () => {
      let weaponModel;

      beforeEach(async () => {
        weaponModel = new WeaponModel();
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
      });

      afterEach(async () => {
        await WeaponModel.deleteMany();
      });

      describe('when being hauled', () => {
        beforeEach(async () => {
          characterModel.inanimates.push({
            inanimateId: weaponModel._id,
            inanimateType: 'weapon',
          });
          await characterModel.save();
        });

        it('loads the character and their item', async () => {
          const uut = new Character(characterModel, world);
          await uut.load();
          assert(uut.inanimates.length === 1);
          assert(uut.inanimates.all[0].name === 'Test');
          assert(uut.carryWeight === 2);
        });
      });

      describe('in a character location', () => {
        beforeEach(async () => {
          characterModel.physicalLocations.rightHand = {
            item: {
              inanimateId: weaponModel._id,
              inanimateType: 'weapon',
            },
          };
          await characterModel.save();
        });

        it('loads the character and their item', async () => {
          const uut = new Character(characterModel, world);
          await uut.load();
          assert(uut.name === characterModel.name);
          assert(uut.physicalLocations.rightHand.item);
          assert(uut.physicalLocations.rightHand.item.name === 'Test');
        });
      });
    });
  });

  describe('save', () => {
    it('saves the properties', async () => {
      characterModel.roomId = roomModel1._id;
      await characterModel.save();

      const uut = new Character(characterModel, world);
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