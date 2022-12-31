"use strict";
//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = __importDefault(require("events"));
const ArmorModel_js_1 = __importDefault(require("../../db/models/ArmorModel.js"));
const ObjectContainer_js_1 = require("../ObjectContainer.js");
const inanimates_js_1 = require("./inanimates.js");
const asyncForEach_js_1 = __importDefault(require("../../lib/asyncForEach.js"));
const log_js_1 = __importDefault(require("../../lib/log.js"));
/**
 * @module game/objects/Armor
 */
/**
 * Weight change event
 *
 * @event Armor#weightChange
 * @type {object}
 * @property {Armor}  item
 * @property {Number} oldWeight
 * @property {Number} newWeight
 */
/**
 * Destroy event
 *
 * @event Inanimate#destroy
 * @type {object}
 * @property {Inanimate} item
 */
/**
 * A class that implements a piece of armor
 */
class Armor extends events_1.default {
    /**
     * Create a new piece of armor
     *
     * @param {ArmorModel} model - The model for this armor
     */
    constructor(model) {
        super();
        this.model = model;
        this.durability = {
            current: 1,
            base: 1,
        };
        this.inanimates = new ObjectContainer_js_1.ObjectContainer();
        this._weight = 0;
        this._onItemDestroyed = (item) => {
            this.removeItem(item);
        };
    }
    /**
     * A high level typing of this inanimate. Used primarily when serializing things around
     *
     * @return {String}
     */
    get itemType() {
        return 'armor';
    }
    /**
     * The ID of the armor
     *
     * @returns {String}
     */
    get id() {
        return this.model._id.toString();
    }
    /**
     * The name of the armor
     *
     * @returns {String}
     */
    get name() {
        return this.model.name;
    }
    /**
     * The weight of the item
     *
     * @returns {Number}
     */
    get weight() {
        return this._weight;
    }
    /**
     * Add an item to be carried
     *
     * @param {Object} item - The item to add to this container
     *
     * @returns {Boolean} True if the item could be added, false otherwise
     */
    addItem(item) {
        if (!this.model.isContainer) {
            return false;
        }
        if (item.id === this.id) {
            return false;
        }
        const reducedWeight = item.weight * (1 - this.model.containerProperties.weightReduction / 100);
        if (this._weight + reducedWeight > this.model.containerProperties.weightCapacity) {
            return false;
        }
        this.emit('weightChange', this, this._weight, (this._weight + reducedWeight));
        this._weight += reducedWeight;
        item.on('destroy', this._onItemDestroyed);
        this.inanimates.addItem(item);
        return true;
    }
    /**
     * Remove a carried item
     *
     * @param {Object} _item - The item to remove from this container
     *
     * @returns {Boolean} True if the item could be removed, false otherwise
     */
    removeItem(_item) {
        if (!this.model.isContainer) {
            return false;
        }
        const item = this.inanimates.removeItem(_item);
        if (!item) {
            return false;
        }
        const reducedWeight = item.weight * (1 - this.model.containerProperties.weightReduction / 100);
        this.emit('weightChange', this, this._weight, (this._weight - reducedWeight));
        this._weight -= reducedWeight;
        item.removeListener('destroy', this._onItemDestroyed);
        return true;
    }
    /**
     * Destroy this object
     *
     * This will recursively destroy all objects contained in this if it is a
     * container. Emits the 'destroy' event.
     */
    async destroy() {
        if (this.model.isContainer) {
            await (0, asyncForEach_js_1.default)(this.inanimates.all, async (item) => {
                await item.destroy();
            });
        }
        log_js_1.default.debug({
            inanimateId: this.id,
        }, `Destroying item ${this.name}`);
        this.emit('destroy', this);
        await ArmorModel_js_1.default.deleteOne({ _id: this.id });
    }
    /**
     * Get an array of the locations that this item can be worn
     *
     * @returns {Array<String>}
     */
    get wearableLocations() {
        return this.model.wearableLocations;
    }
    /**
     * Returns whether or not this item is a container
     *
     * @returns {Boolean}
     */
    get isContainer() {
        return this.model.isContainer;
    }
    /**
     * A short description of the armor
     *
     * @returns {String}
     */
    toShortText() {
        return this.name;
    }
    /**
     * A full description of the armor
     *
     * @return {String}
     */
    toLongText() {
        return `${this.name}\n${this.model.description}`;
    }
    /**
     * Check to see if a player can wear this particular piece of armor
     *
     * @param {Character} character - The character attempting to wear the thing
     *
     * @return {Object} Response object
     *         {Object.result} True if the player can wear it, false otherwise
     *         {Object.reason} String reason if the player cannot wear the item
     */
    checkCanPlayerUse( /*character*/) {
        // TODO: Check level restrictions
        // TODO: Check class restrictions
        return { result: true };
    }
    /**
     * Load the armor from the database model
     */
    async load() {
        this.durability.current = this.model.durability.current;
        this.durability.base = this.model.durability.base;
        this._weight = this.model.weight;
        if (this.model.isContainer) {
            await (0, asyncForEach_js_1.default)(this.model.inanimates, async (inanimateDef) => {
                const inanimate = await (0, inanimates_js_1.loadInanimate)(inanimateDef);
                if (inanimate) {
                    this.addItem(inanimate);
                }
            });
        }
    }
    /**
     * Save the current attributes to the model
     */
    async save() {
        this.model.durability.current = this.durability.current;
        this.model.durability.base = this.durability.base;
        this.model.inanimates = this.inanimates.all.map((inanimate) => {
            return {
                inanimateId: inanimate.id,
                inanimateType: inanimate.itemType,
            };
        });
        await this.model.save();
    }
}
exports.default = Armor;
