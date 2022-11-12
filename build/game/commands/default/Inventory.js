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
import Character from '../../characters/Character.js';
/**
 * @module game/commands/default/Inventory
 */
/**
 * Format a location item
 *
 * @param {Object} locationObject
 * @param {Object} locationObject.item - The item to format
 *
 * @returns {String}
 */
function formatLocationValue(locationObject) {
    if (locationObject && locationObject.item) {
        return locationObject.item.toShortText();
    }
    else {
        return 'Nothing';
    }
}
/**
 * Format a location to human text
 *
 * @param {String} location - The playerCharacter physical location to format
 *
 * @returns {String}
 */
function physicalLocationToText(location) {
    switch (location) {
        case 'arms':
            return 'Arms';
        case 'head':
            return 'Head';
        case 'body':
            return 'Body';
        case 'neck':
            return 'Neck';
        case 'hands':
            return 'Hands';
        case 'legs':
            return 'Legs';
        case 'feet':
            return 'Feet';
        case 'leftFinger':
            return 'Left Finger';
        case 'rightFinger':
            return 'Right Finger';
        case 'leftHand':
            return 'Left Hand';
        case 'rightHand':
            return 'Right Hand';
        case 'back':
            return 'Back';
        default:
            return 'Unknown';
    }
}
/**
 * Inventory action
 */
class InventoryAction {
    /**
     * Create a new InventoryAction
     */
    constructor() {
        this.displayType = 'text';
    }
    /**
     * Execute the Inventory action on the character
     *
     * @param {Character} character - The character to execute on
     */
    execute(character) {
        return __awaiter(this, void 0, void 0, function* () {
            let ret;
            ret = 'Inventory:\n';
            Character.physicalLocations.forEach((location) => {
                ret += `  ${physicalLocationToText(location)}: ${formatLocationValue(character.physicalLocations[location])}\n`;
            });
            ret += '  Hauled:\n';
            if (character.inanimates.length === 0) {
                ret += '    Nothing';
            }
            else {
                character.inanimates.all.forEach((item) => {
                    ret += `    ${item.toShortText()}`;
                });
            }
            const currency = character.currencies.toJSON();
            ret += `\nMoney: ${currency.length === 0 ? 'None' : currency.map(c => `${c.quantity} ${c.name}`).join('; ')}`;
            character.sendImmediate(`${ret}`);
            return;
        });
    }
}
/**
 * Factory class for generating Inventory actions
 */
class InventoryFactory {
    /**
     * This mapping of this factory to the player command
     *
     * @returns {String}
     */
    static get name() {
        return 'inventory';
    }
    /**
     * Create a new factory
     */
    constructor() {
    }
    /**
     * Generate an InventoryAction from the provided player input
     *
     * @param {Array.<String>} tokens - The text the player provided
     *
     * @return {LookAction} On success, the action to execute, or null
     */
    generate() {
        return new InventoryAction();
    }
}
export { InventoryAction, InventoryFactory, };
