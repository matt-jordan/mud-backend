//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';
import mongoose from 'mongoose';

import CharacterModel from '../../../build/db/models/CharacterModel.js';

describe('CharacterModel', () => {

  afterEach(async () => {
    await CharacterModel.deleteMany();
  });

  describe('creating', () => {
    it('rejects if there is no name', async () => {
      const uut = new CharacterModel();
      uut.accountId = new mongoose.Types.ObjectId();

      await assert.rejects(uut.save());
    });

    it('creates a basic character', async () => {
      const uut = new CharacterModel();
      uut.name = 'foo';
      uut.accountId = new mongoose.Types.ObjectId();

      await uut.save();
      assert(uut);
    });

    it('rejects a bad gender value', async () => {
      const uut = new CharacterModel();
      uut.name = 'foo';
      uut.accountId = new mongoose.Types.ObjectId();
      uut.gender = 'something';
      await assert.rejects(uut.save());
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
        head: { item: { inanimateId: new mongoose.Types.ObjectId(), inanimateType: 'armor' } },
        body: { item: { inanimateId: new mongoose.Types.ObjectId(), inanimateType: 'armor' } },
        neck: { item: { inanimateId: new mongoose.Types.ObjectId(), inanimateType: 'armor' } },
        hands: { item: { inanimateId: new mongoose.Types.ObjectId(), inanimateType: 'armor' } },
        legs: { item: { inanimateId: new mongoose.Types.ObjectId(), inanimateType: 'armor' } },
        feet: { item: { inanimateId: new mongoose.Types.ObjectId(), inanimateType: 'armor' } },
        leftFinger: { item: { inanimateId: new mongoose.Types.ObjectId(), inanimateType: 'armor' } },
        rightFinger: { item: { inanimateId: new mongoose.Types.ObjectId(), inanimateType: 'armor' } },
        leftHand: { item: { inanimateId: new mongoose.Types.ObjectId(), inanimateType: 'armor' } },
        rightHand: { item: { inanimateId: new mongoose.Types.ObjectId(), inanimateType: 'weapon' } },
        back: { item: { inanimateId: new mongoose.Types.ObjectId(), inanimateType: 'armor' } },
      };
      uut.defaultAttacks = [
        { energyCost: 3, minDamage: 1, maxDamage: 5, damageType: 'piercing', verbs: { firstPerson: 'bite', thirdPerson: 'bites' }},
        { energyCost: 3, minDamage: 2, maxDamage: 4, damageType: 'bludgeoning', verbs: { firstPerson: 'slam', thirdPerson: 'slams' }},
      ];
      uut.skills = [];
      uut.skills.push({ name: 'defense', level: 10 });
      uut.skills.push({ name: 'attack', level: 2 });
      await uut.save();
      assert(uut);
    });
  });

  describe('findByAccount', () => {
    const accountId = new mongoose.Types.ObjectId();

    beforeEach(async () => {
      const char1 = new CharacterModel();
      char1.name = 'char1';
      char1.accountId = accountId;
      await char1.save();

      const char2 = new CharacterModel();
      char2.name = 'char2';
      char2.accountId = accountId;
      await char2.save();

      const char3 = new CharacterModel();
      char3.name = 'char3';
      char3.accountId = new mongoose.Types.ObjectId();
      await char3.save();
    });

    it('returns all characters associated with an account', async () => {
      const characters = await CharacterModel.findByAccountId(accountId);
      assert(characters);
      assert(characters.length == 2);
      const char1 = characters.find(c => c.name === 'char1');
      assert(char1);
      const char2 = characters.find(c => c.name === 'char2');
      assert(char2);
    });
  });
});
