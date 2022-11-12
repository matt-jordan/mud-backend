//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import EventEmitter from 'events';
import InanimateModel from '../../db/models/InanimateModel.js';
import { ObjectContainer } from '../ObjectContainer.js';
import { loadInanimate } from './inanimates.js';
import asyncForEach from '../../lib/asyncForEach.js';
import log from '../../lib/log.js';
/**
 * @module game/objects/Inanimate
 */
/**
 * Weight change event
 *
 * @event Inanimate#weightChange
 * @type {object}
 * @property {Inanimate} item
 * @property {Number}    oldWeight
 * @property {Number}    newWeight
 */
/**
 * Destroy event
 *
 * @event Inanimate#destroy
 * @type {object}
 * @property {Inanimate} item
 */
/**
 * An inanimate object that isn't worn (like armor) or wielded (like weapons)
 */
class Inanimate extends EventEmitter {
    /**
     * Create a new inaninate object
     *
     * @param {InanimateModel} model - The mode underpinning this object
     */
    constructor(model) {
        super();
        this.model = model;
        this.durability = {
            current: 1,
            base: 1,
        };
        this.inanimates = new ObjectContainer();
        this._weight = 0;
        this._destructionTimerHandle = null;
        this._destructionTime = -1;
        this._destructionTimeEnd;
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
        return 'inanimate';
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
     * Set a timer to destroy this object
     *
     * @param {Number} time - Time in seconds to wait to destroy the object
     */
    setDestructionTimer(time) {
        if (this._destructionTimerHandle) {
            clearTimeout(this._destructionTimerHandle);
        }
        this._destructionTime = time;
        this._destructionTimeEnd = Date.now() + this._destructionTime * 1000;
        log.debug({
            inanimateId: this.id,
            destructionSeconds: time,
            destructionTime: (Date.now() + this._destructionTime * 1000).toString(),
        }, `Setting destruction timer on ${this.name}`);
        this._destructionTimerHandle = setTimeout(() => __awaiter(this, void 0, void 0, function* () {
            yield this.destroy();
        }), time * 1000);
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
    destroy() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.model.isContainer) {
                yield asyncForEach(this.inanimates.all, (item) => __awaiter(this, void 0, void 0, function* () {
                    yield item.destroy();
                }));
            }
            log.debug({
                inanimateId: this.id,
            }, `Destroying item ${this.name}`);
            this.emit('destroy', this);
            yield InanimateModel.deleteOne({ _id: this.id });
        });
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
     * Returns whether or not this item is actually just money
     *
     * @returns {Boolean}
     */
    get isCurrency() {
        return this.model.isCurrency;
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
        let text = `${this.name}\n${this.model.description}`;
        if (this._destructionTime > -1) {
            const now = Date.now();
            const delta = this._destructionTimeEnd - now;
            text += `\n\nDecays in: ${Math.floor(delta / 1000)} seconds`;
        }
        return text;
    }
    /**
     * Load the armor from the database model
     */
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            this.durability.current = this.model.durability.current;
            this.durability.base = this.model.durability.base;
            this._weight = this.model.weight;
            if (this.model.destructionTime > -1) {
                this.setDestructionTimer(this.model.destructionTime);
            }
            if (this.model.isContainer) {
                yield asyncForEach(this.model.inanimates, (inanimateDef) => __awaiter(this, void 0, void 0, function* () {
                    const inanimate = yield loadInanimate(inanimateDef);
                    if (inanimate) {
                        this.addItem(inanimate);
                    }
                }));
            }
        });
    }
    /**
     * Save the current attributes to the model
     */
    save() {
        return __awaiter(this, void 0, void 0, function* () {
            this.model.durability.current = this.durability.current;
            this.model.durability.base = this.durability.base;
            this.model.destructionTime = this._destructionTime;
            this.model.inanimates = this.inanimates.all.map((inanimate) => {
                return {
                    inanimateId: inanimate.id,
                    inanimateType: inanimate.itemType,
                };
            });
            yield this.model.save();
        });
    }
}
export default Inanimate;
