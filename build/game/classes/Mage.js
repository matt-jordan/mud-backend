//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------
import BaseClass from './BaseClass.js';
/**
 * @module game/classes/Mage
 */
class Mage extends BaseClass {
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
        return Object.assign(Object.assign({}, base), { type: this.characterType });
    }
}
export default Mage;
