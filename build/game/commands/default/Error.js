"use strict";
//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorFactory = exports.ErrorAction = void 0;
/**
 * @module game/commands/default/Error
 */
/**
 * Command action for errors that occur
 */
class ErrorAction {
    /**
     * Create a new Error
     *
     * @param {Object} params
     * @param {String} params.message    - The message to send.
     * @param {String} params.command    - The command that the player tried to execute
     * @param {String} params.parameters - The rest of the data
     */
    constructor(params) {
        this.message = params.message;
        this.command = params.command;
        this.parameters = params.parameters;
    }
    /**
     * Execute the command on the player character
     *
     * @param {Character} character - The player to execute on
     */
    execute(character) {
        if (this.message) {
            character.sendImmediate(this.message);
        }
        else {
            character.sendImmediate(`You don't know how to '${this.command}'`);
        }
    }
}
exports.ErrorAction = ErrorAction;
/**
 * Factory that generates DropItemAction objects
 */
class ErrorFactory {
    /**
     * The mapping of this factory to the player command
     */
    static get name() {
        return '__error__';
    }
    /**
     * Create a new factory
     */
    constructor() {
    }
    /**
     * Generate the DropItemAction from player input
     */
    generate(command, tokens = []) {
        return new ErrorAction({ command: command, parameters: tokens.join(' ') });
    }
}
exports.ErrorFactory = ErrorFactory;
