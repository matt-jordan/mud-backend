//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import ArmorModel from '../../db/models/Armor.js';
import { Armor } from './armor.js';
import WeaponModel from '../../db/models/Weapon.js';
import { Weapon } from './weapons.js';

import log from '../../lib/log.js';

/**
 * Loads an inanimate object and its model and returns an instantiated object
 *
 * @param {Object} param
 * @param {Object.ObjectId} inanimateId - The Database ID of the object
 * @param {Object.String} inanimateType - The type of object to create
 *
 * @returns {Weapon} One of Weapon, Armor
 */
async function loadInanimate(param) {
  const { inanimateId, inanimateType } = param;

  let inanimate;
  let inanimateModel;
  switch (inanimateType) {
  case 'armor':
    inanimateModel = await ArmorModel.findById(inanimateId);
    inanimate = new Armor(inanimateModel);
    break;
  case 'weapon':
    inanimateModel = await WeaponModel.findById(inanimateId);
    inanimate = new Weapon(inanimateModel);
    break;
  default:
    log.error({ roomName: this.name, inanimateType }, 'Unknown inanimate type');
    return null;
  }

  await inanimate.load();

  return inanimate;
}


export {
  loadInanimate,
  //saveInanimate,
};