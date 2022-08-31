//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import ArmorModel from '../../db/models/ArmorModel.js';
import Armor from './Armor.js';
import WeaponModel from '../../db/models/WeaponModel.js';
import Weapon from './Weapon.js';
import InanimateModel from '../../db/models/InanimateModel.js';
import Inanimate from './Inanimate.js';

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
  case 'inanimate':
    inanimateModel = await InanimateModel.findById(inanimateId);
    inanimate = new Inanimate(inanimateModel);
    break;
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

  if (inanimateModel && inanimate) {
    await inanimate.load();
    return inanimate;
  } else {
    log.warn({ inanimateId, inanimateType }, 'Unable to load model for inanimate');
  }
  return null;
}


export {
  loadInanimate,
};