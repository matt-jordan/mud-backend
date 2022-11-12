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
/**
 * @module game/commands/default/Stand
 */
/**
 * Class that causes a player to stop resting
 */
class StandAction {
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
    execute(character) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!character.room) {
                character.sendImmediate('You are floating in a void.');
                return;
            }
            character.stand();
        });
    }
}
/**
 * Class that generates StandAction from player input
 */
class StandFactory {
    /**
     * The unique name that maps this factory to the player's command
     *
     * @return {String}
     */
    static get name() {
        return 'stand';
    }
    /**
     * Create a new factory
     */
    constructor() {
    }
    /**
     * Generate a StandAction from player input
     *
     * @returns {StandAction}
     */
    generate() {
        return new StandAction();
    }
}
export { StandAction, StandFactory, };
