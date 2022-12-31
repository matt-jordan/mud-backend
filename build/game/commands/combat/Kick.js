"use strict";
//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KickFactory = exports.KickAction = void 0;
const Character_js_1 = __importDefault(require("../../characters/Character.js"));
const KickAttack_js_1 = __importDefault(require("../../combat/KickAttack.js"));
/**
 * @module game/commands/combat/Kick
 */
/**
 * An action that kicks another character
 */
class KickAction {
    /**
     * Create a new kick action
     *
     * @param {Object} params
     * @param {String} params.target - The target to kick
     */
    constructor(params) {
        this.target = params.target;
    }
    /**
     * Execute the action on the character
     *
     * @param {Character} character - The character who is kicking
     */
    execute(character) {
        if (!character.room) {
            character.sendImmediate('You are floating in a void.');
            return;
        }
        const room = character.room;
        if (character.currentState === Character_js_1.default.STATE.RESTING) {
            character.sendImmediate('You cannot kick, you are resting.');
            return;
        }
        let target;
        let combat;
        let inCombat = false;
        let newCombat = false;
        if (!this.target || this.target.length === 0) {
            const combat = room.combatManager.getCombat(character);
            if (!combat) {
                character.sendImmediate('Who do you want to kick?');
                return;
            }
            inCombat = true;
            target = combat.defender;
        }
        else {
            target = room.characters.findItem(this.target);
            if (!target) {
                character.sendImmediate(`You do not see ${this.target} here`);
                return;
            }
            if (target === character) {
                character.sendImmediate('You cannot kick yourself');
                return;
            }
            combat = room.combatManager.getCombat(character);
            if (combat) {
                inCombat = true;
                if (combat.defender !== target) {
                    newCombat = true;
                }
            }
        }
        // Now that we have a valid target and know if we need to make a new combat,
        // check that we're allowed to do all of this
        const kickAttack = new KickAttack_js_1.default(character, target);
        if (!kickAttack.canPerformAction()) {
            return;
        }
        if (!inCombat) {
            character.sendImmediate(`You attack ${target.toShortText()}!`);
            combat = room.combatManager.addCombat(character, target);
            room.combatManager.addCombat(target, character);
        }
        character.attackActions.push(kickAttack);
        if (newCombat) {
            combat.processRound();
        }
    }
}
exports.KickAction = KickAction;
/**
 * Factory for generating kick commands
 */
class KickFactory {
    /**
     * The mapping of this factory to the player command
     */
    static get name() {
        return 'kick';
    }
    /**
     * Create a new kick factory
     */
    constructor() {
    }
    /**
     * Generate a new KickAction
     *
     * @param {Array.<String>} tokens - The text the player provided
     *
     * @return {KickAction} On success the action to execute, or null
     */
    generate(tokens) {
        // If you are already in combat, we should just queue up the kick to kick
        // the person we're fighting. So we don't do any token checks here.
        return new KickAction({ target: tokens ? tokens.join(' ') : '' });
    }
}
exports.KickFactory = KickFactory;
