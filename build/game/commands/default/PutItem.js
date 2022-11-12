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
import { ErrorAction } from './Error.js';
import Character from '../../characters/Character.js';
import { objectNameComparitor } from '../../ObjectContainer.js';
import { textToPhysicalLocation } from '../../../lib/physicalLocation.js';
import currencyFactory from '../../objects/factories/currency.js';
import log from '../../../lib/log.js';
/**
 * @module game/commands/default/Put
 */
/**
 * An action that puts item into another item that the player carries
 */
class PutItemAction {
    /**
     * Create a new PutItemAction
     *
     * @param {String} source      - The object to move
     * @param {String} destination - The object to put it into
     * @param {Object} options
     * @param {String} [options.location] - The object destination location
     * @param {Number} [options.quantity] - If currency, how much to move
     *
     * @returns {PutItemAction}
     */
    constructor(source, destination, options = {}) {
        this.source = source;
        this.destination = destination;
        this.location = options.location;
        this.quantity = options.quantity;
    }
    /**
     * Execute the action on the character
     *
     * @param {Character} character - The player character
     */
    execute(character) {
        return __awaiter(this, void 0, void 0, function* () {
            let sourceItem;
            if (Number.isInteger(this.quantity)) {
                // Don't create the money or do the withdrawal until we validate the destination
                // and location specified.
                if (!character.currencies.balance(this.source)) {
                    character.sendImmediate(`You do not have ${this.quantity} ${this.source}`);
                    return;
                }
            }
            else {
                sourceItem = character.inanimates.findItem(this.source);
                if (!sourceItem) {
                    character.sendImmediate(`You are not carrying ${this.source}`);
                    return;
                }
            }
            let destinationItem;
            if (!this.location) {
                if (this.destination !== 'inventory') {
                    destinationItem = character.inanimates.findItem(this.destination);
                    if (!destinationItem) {
                        character.sendImmediate(`You are not carrying ${this.destination}`);
                        return;
                    }
                }
            }
            else {
                const locationName = textToPhysicalLocation(this.location);
                if (!(Character.physicalLocations.includes(this.location))) {
                    character.sendImmediate(`${this.location} is not a valid location`);
                    return;
                }
                destinationItem = character.physicalLocations[locationName].item;
                if (!destinationItem) {
                    character.sendImmediate(`You are not wearing anything on ${this.location}`);
                    return;
                }
                if (!objectNameComparitor(destinationItem.name, this.destination)) {
                    character.sendImmediate(`You are not wearing ${this.destination} on your ${this.location}`);
                    return;
                }
            }
            let sourceItemName;
            if (Number.isInteger(this.quantity)) {
                // It should be safe to manipulate currencies at this point, as the destination
                // is a valid object
                sourceItem = yield currencyFactory({ name: this.source, quantity: this.quantity });
                sourceItemName = sourceItem.model.description;
                character.currencies.withdraw(this.source, this.quantity);
            }
            else {
                // Remove non-money items from the inventory
                sourceItemName = sourceItem.toShortText();
                if (!character.removeHauledItem(sourceItem)) {
                    log.warn({ characterId: character.id, sourceItemId: sourceItem.id }, 'Failed to remove hauled item');
                    return;
                }
            }
            if (this.destination === 'inventory') {
                character.addHauledItem(sourceItem);
                character.sendImmediate(`You put ${sourceItemName} in your inventory`);
            }
            else {
                if (!destinationItem.addItem(sourceItem)) {
                    character.sendImmediate(`You cannot put ${sourceItemName} in ${destinationItem.toShortText()}`);
                    // This is the place where we have to do some cleanup. If it is money,
                    // put it back in their balance. If it is non-money, put it in the inventory.
                    if (sourceItem.isCurrency) {
                        character.currencies.deposit(this.source, this.quantity);
                        sourceItem.destroy();
                    }
                    else {
                        character.addHauledItem(sourceItem);
                    }
                    return;
                }
                else {
                    character.sendImmediate(`You put ${sourceItemName} in ${destinationItem.toShortText()}`);
                }
            }
        });
    }
}
/**
 * Factory that generates PutItemAction objects
 */
class PutItemFactory {
    /**
     * The mapping of this factory to the player command
     *
     * @return {String}
     */
    static get name() {
        return 'put';
    }
    /**
     * Create a new factory
     */
    constructor() {
    }
    /**
     * Generate a MoveAction from the provided player input
     *
     * @param {Array.<String>} tokens - The text the player provided
     *
     * @return {MoveAction} On success, the action to execute, or null
     */
    generate(tokens) {
        if (tokens.length === 0) {
            return new ErrorAction({ message: 'What do you want to put?' });
        }
        const index = tokens.indexOf('in');
        if (index === -1) {
            return new ErrorAction({ message: `What do you want to put ${tokens.join(' ')} in?` });
        }
        let source = tokens.slice(0, index);
        let destination = tokens.slice(index + 1, tokens.length);
        if (!source || source.length === 0) {
            return new ErrorAction({ message: `What do you want to put in ${destination.join(' ')}?` });
        }
        if (!destination || destination.length === 0) {
            return new ErrorAction({ message: `What do you want to put ${source.join(' ')} in?` });
        }
        const options = {};
        const quantity = parseInt(source[0], 10);
        if (!isNaN(quantity)) {
            if (quantity <= 0) {
                return new ErrorAction({ message: `${quantity} is not a valid amount.` });
            }
            source = source.slice(1);
            options.quantity = quantity;
        }
        const locIndex = destination.indexOf('on');
        if (locIndex !== -1) {
            const location = destination.slice(locIndex + 1, destination.length);
            destination = destination.slice(0, locIndex);
            if (!location || location.length === 0) {
                return new ErrorAction({ message: `What ${destination.join(' ')} do you want to put ${!isNaN(quantity) ? `${quantity} ` : ''}${source.join(' ')} in?` });
            }
            options.location = location.join(' ');
        }
        return new PutItemAction(source.join(' '), destination.join(' '), options);
    }
}
export { PutItemAction, PutItemFactory, };
