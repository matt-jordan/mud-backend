//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

/**
 * @module game/ObjectContainer
 */

/**
 * Comparator function for comparing two objects
 *
 * @param {Object} _left  - object #1
 * @param {Object} _right - object #2
 *
 * @return {Boolean} True if equal, false otherwise
 */
function objectNameComparitor(_left, _right) {
  const paranthesesRemoval = (word) => {
    const index = word.indexOf('(');
    if (index > -1) {
      return word.slice(0, index);
    }
    return word;
  };

  const left = paranthesesRemoval(_left.toLowerCase()).trim();
  const right = paranthesesRemoval(_right.toLowerCase()).trim();
  return left === right;
}

/**
 * A container that holds objects with names
 */
class ObjectContainer {

  /**
   * Create a new Character container
   */
  constructor() {
    this.objects = [];
    this.room = null;
  }

  /**
   * The number of items in the container
   *
   * @return {Number}
   */
  get length() {
    return this.objects.length;
  }

  /**
   * Return the underlying Array containing all the items
   *
   * This shouldn't be used in conditions where we need to perform some kind
   * of game-based logic on the items, e.g., looking up by a name or keeping
   * objects from being interacted with.
   *
   * @return {Array}
   */
  get all() {
    return this.objects;
  }

  /**
   * Find and remove an item by name
   *
   * This uses case insensitive searching with '.' syntax to disambiguate
   * multiple matches
   *
   * @param {String} name - The name of the item to remove
   *
   * @return {Object} - The removed item or null
   */
  findAndRemoveItem(name) {
    const item = this.findItem(name);
    if (!item) {
      return null;
    }

    return this.removeItem(item);
  }

  /**
   * Finds and returns an item that matches a predicate.
   *
   * Note that this should not be used for name lookups - use FindItem instead.
   *
   * @param {Function} callbackFn
   * @param {Object}   thisArg
   *
   * @returns {Object}
   */
  find(callbackFn, thisArg) {
    if (this.room && this.room.isDark) {
      return null;
    }

    return this.objects.find(callbackFn, thisArg);
  }

  /**
   * Finds and returns a list of items that matches a predicate.
   *
   * Note that this should not be used for name lookups - use FindItem instead.
   *
   * @param {Function} callbackFn
   * @param {Object}   thisArg
   *
   * @returns Array<{Object}>
   */
  filter(callbackFn, thisArg) {
    if (this.room && this.room.isDark) {
      return [];
    }

    return this.objects.filter(callbackFn, thisArg);
  }

  /**
   * Find an item
   * This uses case insensitive searching with '.' syntax to disambiguate
   * multiple matches
   *
   * @param {String} name - The name of the item
   *
   * @return {Object} - the item or null
   */
  findItem(name) {
    if (this.room && this.room.isDark) {
      return null;
    }

    let which = 0;
    if (name.includes('.')) {
      const tokens = name.split('.');
      if (tokens.length !== 2) {
        return null;
      }
      which = parseInt(tokens[0]);
      name = tokens[1];
      if (isNaN(which) || name.length === 0) {
        return null;
      }
    }

    const items = this.objects.filter(item => objectNameComparitor(item.name, name));
    if (items.length === 0 || which >= items.length) {
      return null;
    }
    const item = items[which];

    return item;
  }

  /**
   * Add an item
   *
   * @param {Object} item - The object to add
   */
  addItem(item) {
    this.objects.push(item);
  }

  /**
   * Removes an item from the container
   *
   * @param {Object} item - The object to remove
   *
   * @returns {Object} item or null
   */
  removeItem(item) {
    const index = this.objects.indexOf(item);
    if (index > -1) {
      this.objects.splice(index, 1);
      return item;
    }

    return null;
  }
}

export {
  objectNameComparitor,
  ObjectContainer,
};
