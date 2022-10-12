//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

/**
 * @module lib/DiceBag
 */

import randomInteger from './randomInteger.js';

/**
 * A class that produces dice rolls in something slightly better than pseudorandom
 * but still not fully predictable ways
 */
class DiceBag {

  /**
   * Create a new dice bag
   *
   * @param {Number} min  - The minimum roll a dice can have
   * @param {Number} max  - The maximum roll a dice can have
   * @param {Number} sets - The number of sets of dice to put in the bag
   */
  constructor(min, max, sets) {
    this.min = min;
    this.max = max;
    this.sets = sets;

    this._dice = [];
    this._exhausted = [];
    for (let i = 0; i < this.sets; i += 1) {
      for (let j = min; j <= max; j += 1) {
        this._exhausted.push({ result: j, exhaust: true });
      }
    }

    this._shuffle();
  }

  /**
   * Shuffle _exhausted into _dice
   * @private
   */
  _shuffle() {
    do {
      const index = randomInteger(0, this._exhausted.length - 1);
      const element = this._exhausted.splice(index, 1);
      this._dice.push(...element);
    } while (this._exhausted.length > 0);
  }

  /**
   * Pull a result from the bag
   *
   * @return {Number}
   */
  getRoll() {
    if (this._dice.length === 0) {
      this._shuffle();
    }
    const roll = this._dice.splice(0, 1);
    this._exhausted.push(...roll.filter(r => r.exhaust));
    return roll[0].result;
  }

  /**
   * Override and set what the next dice results will be
   *
   * @param {Number} results - A list of results to prepend. These will not be
   *                           reused when the dice bag is exhausted.
   */
  setNextResults(results) {
    this._dice = results.map(i => {
      return { result: i, exhaust: false };
    }).concat(this._dice);
  }
}

export default DiceBag;
