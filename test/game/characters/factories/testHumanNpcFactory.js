//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import ArmorModel from '../../../../src/db/models/ArmorModel.js';
import WeaponModel from '../../../../src/db/models/WeaponModel.js';
import HumanNpcFactory from '../../../../src/game/characters/factories/HumanNpcFactory.js';
import { createWorld, destroyWorld } from '../../fixtures.js';

describe('HumanNpcFactory', () => {
  let world;

  beforeEach(async () => {
    const results = await createWorld();
    world = results.world;

  });

  afterEach(async () => {
    await destroyWorld();
    await ArmorModel.deleteMany();
    await WeaponModel.deleteMany();
  });

  describe('creating', () => {
    describe('from defaults', () => {
      it('creates a human in the world', async () => {
        const room = world.areas[0].rooms[0];
        const uut = new HumanNpcFactory(world, room);
        assert(uut);
        const npc = await uut.generate();
        assert(npc);
        assert(npc.attacks.length === 1);
        assert(npc.attacks[0].minDamage === 0);
        assert(npc.attacks[0].maxDamage === 2);
        assert(npc.attacks[0].damageType === 'bludgeoning');
        assert(npc.attacks[0].verbs.firstPerson === 'punch');
        assert(npc.attacks[0].verbs.thirdPerson === 'punches');
        assert(npc.room.id === room.id);
        assert(room.characters.all.find((c) => c.id === npc.id));
      });
    });

    describe('with overrides', () => {
      it('creates a human in the world', async () => {
        const room = world.areas[0].rooms[0];
        const uut = new HumanNpcFactory(world, room);
        assert(uut);
        const npc = await uut.generate({
          humanNpc: {
            name: 'Testy',
            age: 200,
            weight: 400,
            gender: 'non-binary',
            strength: 20,
            dexterity: 20,
            constitution: 20,
            intelligence: 20,
            wisdom: 20,
            charisma: 20,
          },
        });
        assert(npc);
        assert(npc.name === 'Testy');
        assert(npc.age === 200);
        assert(npc.weight === 400);
        assert(npc.gender === 'non-binary');
        assert(npc.attributes.strength.base === 20);
        assert(npc.attributes.dexterity.base === 20);
        assert(npc.attributes.constitution.base === 20);
        assert(npc.attributes.intelligence.base === 20);
        assert(npc.attributes.wisdom.base === 20);
        assert(npc.attributes.charisma.base === 20);
      });
    });

    describe('with classes', () => {
      it('creates a human character of the appropriate class type', async () => {
        const room = world.areas[0].rooms[0];
        const uut = new HumanNpcFactory(world, room);
        assert(uut);
        const npc = await uut.generate({
          humanNpc: {
            classPackage: [{
              class: 'fighter',
              level: 2,
            }],
          },
        });
        assert(npc);
        assert(npc.room.id === room.id);
        assert(room.characters.all.find((c) => c.id === npc.id));
        assert(npc.getLevel() === 2);
      });
    });

    describe('with equipment', () => {
      it('creates a human character with equipment', async () => {
        const room = world.areas[0].rooms[0];
        const uut = new HumanNpcFactory(world, room);
        assert(uut);
        const npc = await uut.generate({
          humanNpc: {
            equipment: {
              body: { type: 'breastplate' },
              rightHand: { type: 'longsword' },
            },
          },
        });
        assert(npc);
        assert(npc.room.id === room.id);
        assert(room.characters.all.find((c) => c.id === npc.id));
        assert(npc.physicalLocations.rightHand.item);
        assert(npc.physicalLocations.body.item);
      });
    });
  });
});
