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
/**
 * @module game/commands/default/Examine
 */
/**
 * Command action for examining at things
 */
class ExamineAction {
    /**
     * Create a new ExamineAction
     *
     * @param {String} target - The target object or thing to examine
     */
    constructor(target) {
        this.target = target;
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
            if (!this.target) {
                character.sendImmediate('What do you want to examine?');
                return;
            }
            let item = character.room.inanimates.findItem(this.target);
            if (!item) {
                item = character.room.characters.findItem(this.target);
            }
            if (!item) {
                item = character.inanimates.findItem(this.target);
            }
            if (!item) {
                item = character.room.getDoor(this.target);
            }
            if (!item) {
                character.sendImmediate(`You do not see a ${this.target} here.`);
                return;
            }
            if (item === character) {
                character.sendImmediate('You do not have a mirror.');
                return;
            }
            let retVal;
            retVal = item.toLongText(character);
            character.sendImmediate(retVal);
            character.room.sendImmediate([character], `${character.name} examines ${this.target}`);
        });
    }
}
/**
 * Factory that generates ExamineAction objects
 */
class ExamineFactory {
    /**
     * The mapping of this factory to the player command
     *
     * @return {String}
     */
    static get name() {
        return 'examine';
    }
    /**
     * Create a new factory
     */
    constructor() {
    }
    /**
     * Generate a ExamineAction from the provided player input
     *
     * @param {Array.<String>} tokens - The text the player provided
     *
     * @return {ExamineAction} On success, the action to execute, or null
     */
    generate(tokens) {
        if (!tokens || tokens.length === 0) {
            return new ErrorAction({ message: 'What do you want to examine?' });
        }
        return new ExamineAction(tokens.join(' '));
    }
}
export { ExamineAction, ExamineFactory, };
