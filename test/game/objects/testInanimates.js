//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import WeaponModel from '../../../src/db/models/Weapon.js';
import { Weapon } from '../../../src/game/objects/weapons.js';
import { loadInanimate } from '../../../src/game/objects/inanimates.js';

describe('loadInanimates', () => {

  let weaponModelId;

  beforeEach(async () => {
    const model = new WeaponModel();
    model.name = 'Test';
    model.description = 'A test weapon';
    model.weight = 2;
    model.minDamage = 10;
    model.maxDamage = 20;
    model.durability.current = 5;
    model.durability.base = 10;
    model.weaponType = 'simple';
    model.damageType = 'piercing';
    await model.save();
    weaponModelId = model._id;
  });

  afterEach(async () => {
    await WeaponModel.deleteMany();
  });

  it('loads a weapon', async () => {
    const weapon = await loadInanimate({ inanimateId: weaponModelId, inanimateType: 'weapon' });
    assert(weapon);
    assert(weapon instanceof Weapon === true);
  });
});