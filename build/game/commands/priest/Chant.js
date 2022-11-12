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
// For now, we will just use the Chant command as our place to index into priest
// prayers. If we have alternative ways of invoking them, it may be worth building
// up some kind of registry.
import PrayerOfHealing from '../../effects/priest/PrayerOfHealing.js';
/**
 * @module game/commands/priest/Chant
 */
const prayers = {};
prayers[PrayerOfHealing.name] = PrayerOfHealing;
/**
 * An action that allows a Priest to chant a prayer
 */
class ChantAction {
    /**
     * Create a new chant action
     *
     * @param {String} prayer - The prayer to chant
     */
    constructor(prayer) {
        this.prayer = prayer;
    }
    /**
     * Execute the chant action
     *
     * @param {Character} character - the character who is praying
     */
    execute(character) {
        return __awaiter(this, void 0, void 0, function* () {
            const chantSkill = character.getSkill('chant');
            if (!chantSkill) {
                character.sendImmediate('You do not know how to chant.');
                return;
            }
            if (!this.prayer) {
                const effect = character.effects.find(effect => effect.actionType === 'prayer');
                if (!effect) {
                    character.sendImmediate('What prayer do you want to chant?');
                    return;
                }
                character.sendImmediate(`You are chanting '${effect.name}'.`);
                return;
            }
            if (this.prayer === 'stop') {
                const effect = character.effects.find(effect => effect.actionType === 'prayer');
                if (!effect) {
                    character.sendImmediate('You are not chanting anything.');
                    return;
                }
                character.sendImmediate(`You stop chanting '${effect.name}'.`);
                character.room.sendImmediate([character], `${character.toShortText()} stops chanting '${effect.name}'.`);
                character.effects.remove(effect);
                effect.onExpire();
                return;
            }
            if (!(this.prayer in prayers)) {
                character.sendImmediate(`You do not know '${this.prayer}'.`);
                return;
            }
            const prayerSkill = character.getSkill(this.prayer);
            if (!prayerSkill) {
                character.sendImmediate(`You do not know '${this.prayer}'.`);
                return;
            }
            const effect = character.effects.find(effect => effect.actionType === 'prayer');
            if (effect) {
                character.sendImmediate(`You stop chanting '${effect.name}'.`);
                character.room.sendImmediate([character], `${character.toShortText()} stops chanting '${effect.name}'.`);
                character.effects.remove(effect);
                effect.onExpire();
            }
            const prayerEffect = new prayers[this.prayer]({ character, chantSkill, prayerSkill });
            character.sendImmediate(`You start chanting '${prayerEffect.name}'.`);
            character.room.sendImmediate([character], `${character.toShortText()} starts chanting '${prayerEffect.name}'.`);
            character.effects.push(prayerEffect);
        });
    }
}
/**
 * Factory that produces {ChantAction}
 */
class ChantFactory {
    /**
     * The name of the command
     */
    static get name() {
        return 'chant';
    }
    /**
     * Create a new chant factory
     */
    constructor() {
    }
    /**
     * Generate a new chant action
     *
     * @param {Array.<String>} tokens - The command parameters
     *
     * @returns {ChantAction}
     */
    generate(tokens) {
        if (!tokens || tokens.length === 0) {
            return new ChantAction();
        }
        return new ChantAction(tokens.join(' '));
    }
}
export { ChantAction, ChantFactory };
