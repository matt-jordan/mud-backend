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
var _a, _PrayerOfHealing_character, _PrayerOfHealing_chantSkill, _PrayerOfHealing_prayerSkill, _PrayerOfHealing_BASE_HP_REGEN, _PrayerOfHealing_BASE_MANA_COST;
import Party from '../../characters/party/Party.js';
import log from '../../../lib/log.js';
/**
 * @module game/effects/priest/PrayerOfHealing
 */
/**
 * A healing prayer that converts mana to hp.
 */
class PrayerOfHealing {
    /**
     * Create a new healing prayer effect
     *
     * @param {Character} character - the character who is doing the chanting
     */
    constructor({ character, chantSkill, prayerSkill }) {
        _PrayerOfHealing_character.set(this, void 0);
        _PrayerOfHealing_chantSkill.set(this, void 0);
        _PrayerOfHealing_prayerSkill.set(this, void 0);
        __classPrivateFieldSet(this, _PrayerOfHealing_character, character, "f");
        __classPrivateFieldSet(this, _PrayerOfHealing_chantSkill, chantSkill, "f");
        __classPrivateFieldSet(this, _PrayerOfHealing_prayerSkill, prayerSkill, "f");
        this.tick = Number.MAX_SAFE_INTEGER; // Never expire. This will remove itself.
    }
    /**
     * The name of the prayer
     *
     * @returns {String}
     */
    static get name() {
        return 'prayer of healing';
    }
    /**
     * The type of action (or effect?) this is
     *
     * @returns {String}
     */
    get actionType() {
        return 'prayer';
    }
    /**
     * The name of the prayer
     *
     * @returns {String}
     */
    get name() {
        return PrayerOfHealing.name;
    }
    /**
     * Check if the player can perform the requested action
     *
     * @returns {Boolean} True if they can perform the action, false otherwise
     */
    checkAction() {
        return true;
    }
    /**
     * Called on each tick
     */
    onTick() {
        const manaCost = Math.max(__classPrivateFieldGet(PrayerOfHealing, _a, "f", _PrayerOfHealing_BASE_MANA_COST) - Math.floor(__classPrivateFieldGet(this, _PrayerOfHealing_chantSkill, "f") / 10), 1);
        const hpRegen = __classPrivateFieldGet(PrayerOfHealing, _a, "f", _PrayerOfHealing_BASE_HP_REGEN) + Math.pow(2, Math.floor(__classPrivateFieldGet(this, _PrayerOfHealing_prayerSkill, "f") / 20));
        if (__classPrivateFieldGet(this, _PrayerOfHealing_character, "f").attributes.manapoints.current - manaCost < 0) {
            log.debug({ manaCost, hpRegen, characterId: __classPrivateFieldGet(this, _PrayerOfHealing_character, "f").id }, 'Character ran out of mana; expiring prayer of healing effect');
            this.tick = 0;
            return;
        }
        function apply(character) {
            let appliedHpRegen = hpRegen;
            if (character !== __classPrivateFieldGet(this, _PrayerOfHealing_character, "f")) {
                appliedHpRegen = Math.ceil(hpRegen * 1.5); // Bonus applied to party members
            }
            log.debug({ manaCost, appliedHpRegen, characterId: character.id }, 'Applying prayer of healing effect');
            character.attributes.hitpoints.current = Math.min(character.attributes.hitpoints.current + appliedHpRegen, character.attributes.hitpoints.base);
            character.sendImmediate(character.toCharacterDetailsMessage());
        }
        // Pay the mana cost here, apply the HP to themselves or the party
        __classPrivateFieldGet(this, _PrayerOfHealing_character, "f").attributes.manapoints.current = Math.max(__classPrivateFieldGet(this, _PrayerOfHealing_character, "f").attributes.manapoints.current - manaCost, 0);
        const party = Party.getParty(__classPrivateFieldGet(this, _PrayerOfHealing_character, "f"));
        if (!party) {
            apply.bind(this)(__classPrivateFieldGet(this, _PrayerOfHealing_character, "f"));
        }
        else {
            party.applyEffect(apply.bind(this));
        }
    }
    /**
     * Callback called when this action is first added to a character
     */
    onInitialPush() {
        const party = Party.getParty(__classPrivateFieldGet(this, _PrayerOfHealing_character, "f"));
        if (!party) {
            __classPrivateFieldGet(this, _PrayerOfHealing_character, "f").sendImmediate('You are surrounded by a healing glow.');
        }
        else {
            party.applyEffect((character) => character.sendImmediate('You are surrounded by a healing glow.'));
        }
    }
    /**
     * Callback called when this action is no longer in effect on a character
     */
    onExpire() {
        const party = Party.getParty(__classPrivateFieldGet(this, _PrayerOfHealing_character, "f"));
        if (!party) {
            __classPrivateFieldGet(this, _PrayerOfHealing_character, "f").sendImmediate('The healing glow fades from around you.');
        }
        else {
            party.applyEffect((character) => character.sendImmediate('The healing glow fades from around you.'));
        }
    }
}
_a = PrayerOfHealing, _PrayerOfHealing_character = new WeakMap(), _PrayerOfHealing_chantSkill = new WeakMap(), _PrayerOfHealing_prayerSkill = new WeakMap();
_PrayerOfHealing_BASE_HP_REGEN = { value: 1 };
_PrayerOfHealing_BASE_MANA_COST = { value: 6 };
export default PrayerOfHealing;
