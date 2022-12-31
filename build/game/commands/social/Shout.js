"use strict";
//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShoutFactory = exports.ShoutAction = void 0;
const Error_js_1 = require("../default/Error.js");
/**
 * @module game/commands/social/Shout
 */
/**
 * Command action for shouting something
 */
class ShoutAction {
    /**
     * Create a new ShoutAction
     *
     * @param {String} message - message to send to all rooms in an area
     */
    constructor(message) {
        this.message = message.join(' ');
    }
    /**
     * Execute the action on the character
     *
     * @param {Character} character - The character to execute on
     */
    async execute(character) {
        if (!character.room) {
            character.sendImmediate('You are floating in a void');
            return;
        }
        if (!character.world) {
            character.sendImmediate('You are not in a world');
            return;
        }
        const area = character.world.findAreaById(character.room.areaId);
        if (!area) {
            character.sendImmediate('You are not in an area, and cannot shout');
            return;
        }
        area.rooms.forEach((room) => {
            room.sendImmediate([character], {
                socialType: 'shout',
                language: character.language || 'common',
                sender: `${character.toShortText()}`,
                text: `${this.message}`,
            });
        });
        character.sendImmediate(`You shout, "${this.message}"`);
    }
}
exports.ShoutAction = ShoutAction;
/**
 * Factory that generates ShoutAction objects
 */
class ShoutFactory {
    /**
     * The mapping of this factory to the player command
     *
     * @return {String}
     */
    static get name() {
        return 'shout';
    }
    /**
     * Create a new factory
     */
    constructor() {
    }
    /**
     * Generate a ShoutAction from the provided player input
     *
     * @param {Array.<String>} tokens - The text the player provided
     *
     * @return {ShoutAction} On success, the action to execute, or null
     */
    generate(tokens) {
        if (!tokens || tokens.length === 0) {
            return new Error_js_1.ErrorAction({ command: 'Shout', message: 'What do you want to shout?' });
        }
        return new ShoutAction(tokens);
    }
}
exports.ShoutFactory = ShoutFactory;
