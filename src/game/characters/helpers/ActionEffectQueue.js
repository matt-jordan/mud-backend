//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

/**
 * @module game/characters/helpers/ActionEffectQueue
 */

/**
 * A queue for actions or effects that a character has enqueued on them
 */
class ActionEffectQueue {
  #queue;

  /**
   * Create a new action/effect queue
   */
  constructor() {
    this.#queue = [];
  }

  /**
   * Decrement the tick counter on all the items in the queue, eject the expired
   * entries and return them
   *
   * @returns {List}
   */
  decrementAndExpire() {
    const expiredItems = [];
    const remainingItems = [];
    while (this.#queue.length !== 0) {
      const item = this.#queue.pop();
      item.tick -= 1;
      if (item.tick > 0) {
        item.onTick?.();
        remainingItems.push(item);
        continue;
      }

      item.onExpire?.();
      expiredItems.push(item);
    }
    this.#queue = remainingItems;

    return expiredItems;
  }

  /**
   * Returns true if every item in the underlying queue matches a predicate
   *
   * @param {Function} callbackFn
   * @param {Object}   thisArg
   *
   * @returns {Boolean}
   */
  every(callbackFn, thisArg) {
    return this.#queue.every(callbackFn, thisArg);
  }

  /**
   * Finds and returns an element that matches a predicate
   *
   * @param {Function} callbackFn
   * @param {Object}   thisArg
   *
   * @returns {Object}
   */
  find(callbackFn, thisArg) {
    return this.#queue.find(callbackFn, thisArg);
  }

  /**
   * Push an item onto the queue
   *
   * @param {Object} item - The action/effect item
   */
  push(item) {
    item.onInitialPush?.();
    this.#queue.push(item);
  }

  /**
   * The number of items in the queue
   *
   * @returns {Number}
   */
  get length() {
    return this.#queue.length;
  }

}

export default ActionEffectQueue;