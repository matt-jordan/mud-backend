"use strict";
//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
exports.RestFactory = exports.RestAction = void 0;
/**
 * @module game/commands/default/Rest
 */
/**
 * Class that causes a player to rest
 */
class RestAction {
    /**
     * Create a new action
     */
    constructor() {
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
        character.rest();
    }
}
exports.RestAction = RestAction;
/**
 * Class that generates RestAction from player input
 */
class RestFactory {
    /**
     * The unique name that maps this factory to the player's command
     *
     * @return {String}
     */
    static get name() {
        return 'rest';
    }
    /**
     * Create a new RestFactory
     */
    constructor() {
    }
    /**
     * Generate a RestAction from player input
     *
     * @returns {RestAction}
     */
    generate() {
        return new RestAction();
    }
}
exports.RestFactory = RestFactory;
