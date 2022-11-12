//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _StunAction_character;
import Character from '../characters/Character.js';
class StunAction {
    constructor({ character, ticks = 1, }) {
        _StunAction_character.set(this, void 0);
        __classPrivateFieldSet(this, _StunAction_character, character, "f");
        this.ticks = ticks;
    }
    /**
     * The verbs associated with the action we're performing
     */
    get verbs() {
        return {
            firstPerson: 'stun',
            thirdPerson: 'stuns',
        };
    }
    /**
     * Adjective describing the state of the character
     */
    get adjective() {
        return 'stunned';
    }
    /**
     * The type of action this is
     *
     * @returns {String}
     */
    get actionType() {
        return 'effect';
    }
    /**
     * Check if the player can perform the requested action
     *
     * @param {String} action - The type of action being requested.
     *
     * @returns {Boolean} True if they can perform the action, false otherwise
     */
    checkAction(action) {
        switch (action) {
            case 'move':
            case 'rest':
            case 'attack':
                // If the character is in combat, they already know they're stunned.
                if (__classPrivateFieldGet(this, _StunAction_character, "f").currentState !== Character.STATE.FIGHTING) {
                    __classPrivateFieldGet(this, _StunAction_character, "f").sendImmediate(`You cannot ${action}, you are stunned!`);
                }
                return false;
            default:
                return true;
        }
    }
    /**
     * Callback called when this action is first added to a character
     */
    onInitialPush() {
        __classPrivateFieldGet(this, _StunAction_character, "f").sendImmediate('You are stunned!');
    }
    /**
     * Callback called when this action is no longer in effect on a character
     */
    onExpire() {
        __classPrivateFieldGet(this, _StunAction_character, "f").sendImmediate('You are no longer stunned.');
    }
}
_StunAction_character = new WeakMap();
export default StunAction;
