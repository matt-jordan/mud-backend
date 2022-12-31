"use strict";
//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloseFactory = exports.CloseAction = void 0;
/**
 * @module game/commands/default/Close
 */
class CloseAction {
    /**
     * Create a new close action
     *
     * @param {String} target - The intended door to close
     */
    constructor(target) {
        this.target = target;
    }
    /**
     * Execute the action on the character
     *
     * @param {Character} character - The character to execute the action on
     */
    async execute(character) {
        if (!character.room) {
            character.sendImmediate('You are floating in a void.');
            return;
        }
        const door = character.room.getDoor(this.target);
        if (!door) {
            character.sendImmediate(`You do not see a ${this.target} here`);
            return;
        }
        if (!door.isOpen) {
            character.sendImmediate(`The ${this.target} is already closed.`);
            return;
        }
        door.isOpen = false;
        character.sendImmediate(`You close the ${door.toShortText()}.`);
        character.room.sendImmediate([character], `${character.toShortText()} closes the ${door.toShortText()}.`);
    }
}
exports.CloseAction = CloseAction;
class CloseFactory {
    /**
     * The unique name that maps this factory to the player's command
     *
     * @return {String}
     */
    static get name() {
        return 'close';
    }
    /**
     * Create a new factory
     */
    constructor() {
    }
    /**
     * Generate a CloseAction
     *
     * @returns {CloseAction}
     */
    generate(tokens) {
        return new CloseAction(tokens.join(' '));
    }
}
exports.CloseFactory = CloseFactory;
