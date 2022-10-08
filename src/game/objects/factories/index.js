//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import backpackFactory from './backpack.js';
import bootsFactory from './boots.js';
import breastplateFactory from './breastplate.js';
import capFactory from './cap.js';
import cloakFactory from './cloak.js';
import glovesFactory from './gloves.js';
import leggingsFactory from './leggings.js';
import longswordFactory from './longsword.js';
import maceFactory from './mace.js';
import ringFactory from './ring.js';
import robeFactory from './robe.js';
import shieldFactory from './shield.js';
import shirtFactory from './shirt.js';
import shortswordFactory from './shortsword.js';

/**
 * @module game/objects/factories/index
 */

const factoryMap = {
  backpack: backpackFactory,
  breastplate: breastplateFactory,
  boots: bootsFactory,
  cap: capFactory,
  cloak: cloakFactory,
  gloves: glovesFactory,
  leggings: leggingsFactory,
  longsword: longswordFactory,
  mace: maceFactory,
  ring: ringFactory,
  robe: robeFactory,
  shield: shieldFactory,
  shirt: shirtFactory,
  shortsword: shortswordFactory,
};

/**
 * Obtain a factory by the thing that it generates
 *
 * @param {String} factory - The object factory to obtain
 *
 * @returns {Object} a factory
 */
const objectFactories = (factory) => {
  if (!(factory in factoryMap)) {
    throw Error(`${factory} does not exist`);
  }

  return factoryMap[factory];
};

export default objectFactories;
