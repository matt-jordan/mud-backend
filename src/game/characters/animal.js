//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import PlayerCharacter from './playerCharacter.js';

/**
 * A creature of some sort that behaves in a particular way
 *
 * Vague, to be sure. But the general idea is that the logic for how animals
 * behave is largely consistent, and that most of our logic can be handled by
 * the type of animals being constructed.
 *
 * Sub-classes, maybe.
 */
class Animal extends PlayerCharacter {

  constructor(model, world) {
    super(model, world);
  }

  onTick() {
    super.onTick();
  }

}

export default Animal;
