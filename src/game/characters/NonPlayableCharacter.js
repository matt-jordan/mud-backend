//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import RandomWanderer from './ai/RandomWanderer.js';
import asyncForEach from '../../lib/asyncForEach.js';
import log from '../../lib/log.js';

/**
 * @module game/characters/NonPlayableCharacter
 */

/**
 * Class representing a non-playable character
 */
const NonPlayableCharacter = (BaseClass) => class extends BaseClass {

  /**
   * Create a new non-playable character
   *
   * @param {CharacterModel} model - The model for the non-playable character
   * @param {World}          world - The one and only world
   */
  constructor(model, world) {
    super(model, world);

    this.ai = [];
  }

  async onTick() {
    if (super.onTick) {
      super.onTick();
    }

    await asyncForEach(this.ai, async (ai) => {
      await ai.onTick();
    });
  }

  async load(loadSet = null) {
    if (!super.load) {
      return;
    }
    await super.load(loadSet);

    // Don't load properties more than once
    if (loadSet) {
      return;
    }

    if (this.model.ais) {
      this.model.ais.forEach((aiDef) => {
        switch (aiDef.name) {
        case 'RandomWanderer':
          this.ai.push(new RandomWanderer(this));
          break;
        default:
          log.warn({ characterId: this.id, aiName: aiDef.name }, 'Unknown AI');
        }
      });
    }
  }

  async save() {
    if (!super.save) {
      // weird
      return;
    }

    this.model.ais = [];
    this.ai.forEach((ai) => {
      this.model.ais.push({ name: ai.name });
    });

    // The base class will save the model, so call it last
    await super.save();
  }

};

export default NonPlayableCharacter;