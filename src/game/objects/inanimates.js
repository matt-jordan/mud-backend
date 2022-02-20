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
 * Comparator function for comparing two inanimate objects
 *
 * @param {Object} _left  - Inanimate object #1
 * @param {Object} _right - Inanimate object #2
 *
 * @return {Boolean} True if equal, false otherwise
 */
function inanimateNameComparitor(_left, _right) {
  const left = _left.toLowerCase();
  const right = _right.toLowerCase();

  return left === right;
}

/**
 * A container that holds inanimate objects
 */
class InanimateContainer {

  /**
   * Create a new inanimate container
   */
  constructor() {
    this.inanimates = [];
  }

  /**
   * The number of items in the container
   *
   * @return {Number}
   */
  get length() {
    return this.inanimates.length;
  }

  /**
   * Return the underlying Array containing all the items
   *
   * @return {Array}
   */
  get all() {
    return this.inanimates;
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
   * Find an item
   * This uses case insensitive searching with '.' syntax to disambiguate
   * multiple matches
   *
   * @param {String} name - The name of the item
   *
   * @return {Object} - the item or null
   */
  findItem(name) {
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

    const items = this.inanimates.filter(item => inanimateNameComparitor(item.name, name));
    if (items.length === 0 || which >= items.length) {
      return null;
    }
    const item = items[which];

    return item;
  }

  /**
   * Add an item
   *
   * @param {Object} item - The inanimate object to add
   */
  addItem(item) {
    this.inanimates.push(item);
  }

  /**
   * Removes an item from the container
   *
   * @param {Object} item - The inanimate object to remove
   *
   * @returns {Object} item or null
   */
  removeItem(item) {
    const index = this.inanimates.indexOf(item);
    if (index > -1) {
      this.inanimates.splice(index, 1);
      return item;
    }

    return null;
  }
}

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
  inanimateNameComparitor,
  InanimateContainer,
  loadInanimate,
};