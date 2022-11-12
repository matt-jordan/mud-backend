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
import { ErrorAction } from '../default/Error.js';
/**
 * @module game/commands/social/Say
 */
/**
 * Command action for saying something
 */
class SayAction {
    /**
     * Create a new SayAction
     *
     * @param {String} message - message to send to the room
     */
    constructor(message) {
        this.message = message.join(' ');
    }
    /**
     * Execute the action on the character
     *
     * @param {Character} character - The character to execute on
     */
    execute(character) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!character.room) {
                character.sendImmediate('You are floating in a void');
                return;
            }
            character.sendImmediate(`You say, "${this.message}"`);
            character.room.sendImmediate([character], {
                socialType: 'say',
                language: character.language || 'common',
                sender: `${character.toShortText()}`,
                text: `${this.message}`,
            });
        });
    }
}
/**
 * Factory that generates SayAction objects
 */
class SayFactory {
    /**
     * The mapping of this factory to the player command
     *
     * @return {String}
     */
    static get name() {
        return 'say';
    }
    /**
     * Create a new factory
     */
    constructor() {
    }
    /**
     * Generate a SayAction from the provided player input
     *
     * @param {Array.<String>} tokens - The text the player provided
     *
     * @return {SayAction} On success, the action to execute, or null
     */
    generate(tokens) {
        if (!tokens || tokens.length === 0) {
            return new ErrorAction({ command: 'Say', message: 'What do you want to say?' });
        }
        return new SayAction(tokens);
    }
}
export { SayAction, SayFactory, };
