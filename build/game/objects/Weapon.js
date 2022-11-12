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
import WeaponModel from '../../db/models/WeaponModel.js';
import log from '../../lib/log.js';
/**
 * @module game/objects/Weapon
 */
/**
 * A class that implements a weapon
 */
class Weapon extends EventEmitter {
    /**
     * Create a new weapon
     *
     * @param {WeaponModel} The database model for the weapon
     */
    constructor(model) {
        super();
        this.model = model;
        this.durability = {
            current: 1,
            base: 1,
        };
    }
    /**
     * A high level typing of this inanimate. Used primarily when serializing things around
     *
     * @return {String}
     */
    get itemType() {
        return 'weapon';
    }
    /**
     * The ID of the weapon
     *
     * @returns {String}
     */
    get id() {
        return this.model._id.toString();
    }
    /**
     * The name of the weapon
     *
     * @returns {String}
     */
    get name() {
        return this.model.name;
    }
    /**
     * A description of the weapon
     *
     * @returns {String}
     */
    get description() {
        return this.model.description;
    }
    /**
     * The weight of the weapon
     *
     * @returns {Number}
     */
    get weight() {
        return this.model.weight;
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
     * The minimum damage of the weapon
     *
     * @returns {Number}
     */
    get minDamage() {
        return this.model.minDamage;
    }
    /**
     * The maximum damage of the weapon
     *
     * @returns {Number}
     */
    get maxDamage() {
        return this.model.maxDamage;
    }
    /**
     * Verbs for the weapon's attack
     *
     * @returns {Object}
     * @returns {Object.firstPerson}
     * @returns {Object.thirdPerson}
     */
    get verbs() {
        switch (this.model.damageType) {
            case 'slashing':
                return {
                    firstPerson: 'slash',
                    thirdPerson: 'slashes',
                };
            case 'piercing':
                return {
                    firstPerson: 'pierce',
                    thirdPerson: 'pierces',
                };
            case 'bludgeoning':
                return {
                    firstPerson: 'smash',
                    thirdPerson: 'smashes',
                };
        }
        return {
            firstPerson: 'swing',
            thirdPerson: 'swinges',
        };
    }
    /**
     * Destroy this object
     *
     * Emits the 'destroy' event.
     */
    destroy() {
        return __awaiter(this, void 0, void 0, function* () {
            log.debug({
                inanimateId: this.id,
            }, `Destroying item ${this.name}`);
            this.emit('destroy', this);
            yield WeaponModel.deleteOne({ _id: this.id });
        });
    }
    /**
     * Convert the weapon into a basic attack object useful for combat work
     *
     * @returns {Object}
     */
    toAttack(character) {
        return {
            minDamage: this.model.minDamage,
            maxDamage: this.model.maxDamage,
            // TODO: Put this on the model
            energyCost: Math.max(5 - Math.floor(character.getSkill(this.model.damageType) / 10), 1),
            minCritical: 20,
            maxCritical: 20,
            criticalModifier: 2,
            verbs: this.verbs,
            damageType: this.model.damageType,
            name: this.model.name,
            hitBonus: Math.floor(character.getSkill(this.model.damageType) / 10),
        };
    }
    /**
     * A short description of the weapon
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
     * Load the weapon from the database model
     */
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            this.durability.current = this.model.durability.current;
            this.durability.base = this.model.durability.base;
        });
    }
    /**
     * Save the weapon to the database model
     */
    save() {
        return __awaiter(this, void 0, void 0, function* () {
            this.model.durability.current = this.durability.current;
            this.model.durability.base = this.durability.base;
            yield this.model.save();
        });
    }
}
export default Weapon;
