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
const BaseClass_js_1 = __importDefault(require("./BaseClass.js"));
/**
 * @module game/classes/Mage
 */
class Mage extends BaseClass_js_1.default {
    /**
     * Create a new fighter class
     */
    constructor(character) {
        super(character);
        this.hitDice = 6;
        this.energyDice = 6;
        this.manaDice = 10;
        this.setLevel();
    }
    /**
     * The underlying class type
     */
    get characterType() {
        return 'mage';
    }
    /**
     * A character's mana points bonus
     *
     * @returns {Number}
     */
    get manapointBonus() {
        return this.character.getAttributeModifier('intelligence');
    }
    /**
     * Set the level properties on the character
     */
    setLevel() {
        switch (this.level) {
            case 1:
                if (!this.character.skills.has('piercing')) {
                    this.character.skills.set('piercing', 1);
                }
                break;
            case 2:
                break;
            default:
                break;
        }
    }
    /**
     * Convert this class to JSON
     *
     * @return {Object}
     */
    toJson() {
        const base = super.toJson();
        return {
            ...base,
            type: this.characterType,
        };
    }
}
exports.default = Mage;
