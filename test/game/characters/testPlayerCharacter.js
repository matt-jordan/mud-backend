import mongoose from 'mongoose';
import assert from 'power-assert';

import World from '../../../src/game/world/world.js';
import PlayerCharacter from '../../../src/game/characters/playerCharacter.js';
import CharacterModel from '../../../src/db/models/Character.js';
import AreaModel from '../../../src/db/models/Area.js';
import RoomModel from '../../../src/db/models/Room.js';

describe('PlayerCharacter', () => {
  let characterModel;
  let world;
  let roomModel1;

  beforeEach(async () => {
    const areaModel = new AreaModel();
    areaModel.name = 'TestArea';

    roomModel1 = new RoomModel();
    roomModel1.name = 'TestRoom1';
    roomModel1.areaId = areaModel._id;
    await roomModel1.save();

    const roomModel2 = new RoomModel();
    roomModel2.name = 'TestRoom2';
    roomModel2.areaId = areaModel._id;
    await roomModel2.save();

    areaModel.roomIds.push(roomModel1._id);
    areaModel.roomIds.push(roomModel2._id);
    await areaModel.save();

    world = new World();
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

  });

});