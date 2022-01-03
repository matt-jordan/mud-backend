import assert from 'power-assert';
import mongoose from 'mongoose';

import CharacterModel from '../../../src/db/models/Character.js';

describe('CharacterModel', () => {

  afterEach(async () => {
    await CharacterModel.deleteMany();
  });

  describe('creating', () => {
    it('rejects if there is no name', async () => {
      const uut = new CharacterModel();
      uut.accountId = new mongoose.Types.ObjectId();

      assert.rejects(uut.save());
    });

    it('rejects if there is no accountID', () => {
      const uut = new CharacterModel();
      uut.name = 'foo';

      assert.rejects(uut.save());
    });

    it('rejects a bad gender value', () => {
      const uut = new CharacterModel();
      uut.name = 'foo';
      uut.accountId = new mongoose.Types.ObjectId();
      uut.gender = 'something';
      assert.rejects(uut.save());
    });

    it('creates a basic character', async () => {
      const uut = new CharacterModel();
      uut.name = 'foo';
      uut.accountId = new mongoose.Types.ObjectId();

      await uut.save();
      assert(uut);
    });

    it('creates a full character with all attributes', async () => {
      const accountId = new mongoose.Types.ObjectId();
      const roomId = new mongoose.Types.ObjectId();

      const uut = new CharacterModel();
      uut.name = 'foo';
      uut.accountId = accountId;
      uut.description = 'A complete character';
      uut.age = 30;
      uut.gender = 'non-binary';
      uut.roomId = roomId;
      uut.classes.push({
        type: 'Warrior',
        level: 1,
        experience: 0,
      });
      uut.attributes = {
        strength: { base: 10, },
        dexterity: { base: 10, },
        constitution: { base: 10, },
        intelligence: { base: 10, },
        wisdom: { base: 10, },
        charisma: { base: 10, },
        hitpoints: { base: 6, current: 6, },
        manapoints: { base: 6, current: 6, },
        energypoints: { base: 10, current: 10, },
      };
      uut.physicalLocations = {
        head: { item: new mongoose.Types.ObjectId(), },
        body: { item: new mongoose.Types.ObjectId(), },
        neck: { item: new mongoose.Types.ObjectId(), },
        hands: { item: new mongoose.Types.ObjectId(), },
        legs: { item: new mongoose.Types.ObjectId(), },
        feet: { item: new mongoose.Types.ObjectId(), },
        leftFinger: { item: new mongoose.Types.ObjectId(), },
        rightFinger: { item: new mongoose.Types.ObjectId(), },
        leftHand: { item: new mongoose.Types.ObjectId(), },
        rightHand: { item: new mongoose.Types.ObjectId(), },
        back: { item: new mongoose.Types.ObjectId(), },
      };
      await uut.save();
      assert(uut);
    });
  });
});
