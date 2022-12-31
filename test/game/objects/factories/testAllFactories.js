//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import objectFactories from '../../../../src/game/objects/factories/index.js';
import ArmorModel from '../../../../src/db/models/ArmorModel.js';
import WeaponModel from '../../../../src/db/models/WeaponModel.js';


describe('Object factories', () => {

  afterEach(async () => {
    await ArmorModel.deleteMany();
    await WeaponModel.deleteMany();
  });

  [
    { name: 'backpack' },
    { name: 'boots',
      scenarios: [
        { material: 'cloth' },
        { material: 'leather' },
        { material: 'hard leather' },
        { material: 'copper' },
        { material: 'iron' },
        { material: 'steel' },
      ],
      validateFn: (scenario, actual) => {
        if (scenario.material) {
          assert(actual.name.includes(scenario.material), actual.name);
        }
      },
    },
    { name: 'breastplate',
      scenarios: [
        { material: 'leather' },
        { material: 'hard leather' },
        { material: 'copper' },
        { material: 'iron' },
        { material: 'steel' },
      ],
      validateFn: (scenario, actual) => {
        if (scenario.material) {
          assert(actual.name.includes(scenario.material), actual.name);
        }
      },
    },
    { name: 'cap',
      scenarios: [
        { material: 'cloth' },
        { material: 'leather' },
        { material: 'hard leather' },
        { material: 'copper' },
        { material: 'iron' },
        { material: 'steel' },
      ],
      validateFn: (scenario, actual) => {
        if (scenario.material) {
          assert(actual.name.includes(scenario.material), actual.name);
        }
      },
    },
    { name: 'cloak' },
    { name: 'gloves',
      scenarios: [
        { material: 'cloth' },
        { material: 'leather' },
        { material: 'hard leather' },
        { material: 'copper' },
        { material: 'iron' },
        { material: 'steel' },
      ],
      validateFn: (scenario, actual) => {
        if (scenario.material) {
          assert(actual.name.includes(scenario.material), actual.name);
        }
      },
    },
    { name: 'leggings',
      scenarios: [
        { material: 'cloth' },
        { material: 'leather' },
        { material: 'hard leather' },
        { material: 'copper' },
        { material: 'iron' },
        { material: 'steel' },
      ],
      validateFn: (scenario, actual) => {
        if (scenario.material) {
          assert(actual.name.includes(scenario.material), actual.name);
        }
      },
    },
    { name: 'longsword' },
    { name: 'mace' },
    { name: 'ring',
      scenarios: [
        {
          name: 'foo',
          description: 'bar',
        },
        {
          modifiers: [
            { type: 'attribute', value: 'strength', modifier: 2 },
            { type: 'damageBonus', value: 6 }
          ]
        }
      ],
      validateFn: (scenario, actual) => {
        if (scenario.name) {
          assert(scenario.name === actual.name, scenario.name);
        }
        if (scenario.description) {
          assert(scenario.description === actual.model.description,
            `${scenario.description} != ${actual.model.description}`);
        }
        if (scenario.modifiers) {
          assert(scenario.modifiers.length === actual.model.modifiers.length);
        }
      },
    },
    { name: 'robe' },
    { name: 'shirt' },
    { name: 'shield',
      scenarios: [
        {
          name: 'foobar',
          description: 'ohrly',
        },
        {
          size: 'small',
          material: 'wood',
        }
      ],
      validateFn: (scenario, actual) => {
        if (scenario.name) {
          assert(scenario.name === actual.name, scenario.name);
        }
        if (scenario.description) {
          assert(scenario.description === actual.model.description);
        }
        if (scenario.size) {
          assert(scenario.size === actual.model.size);
        }
      }
    },
    { name: 'shortsword' }
  ].forEach((testCase) => {
    describe(`${testCase.name}`, () => {
      const scenarios = [{}];
      if (testCase.scenarios) {
        scenarios.push(...testCase.scenarios);
      }
      scenarios.forEach((scenario) => {
        describe(`creating ${testCase.name} with ${JSON.stringify(scenario)}`, () => {
          it('creates the object', async () => {
            const factory = objectFactories(testCase.name);
            assert(factory);
            const uut = await factory(scenario);
            assert(uut);
            if (testCase.validateFn) {
              testCase.validateFn(scenario, uut);
            } else {
              assert(uut.name.includes(testCase.name), `${uut.name} != ${testCase.name}`);
            }
          });
        });
      });
    });
  });
});
