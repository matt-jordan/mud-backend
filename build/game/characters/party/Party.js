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
var _a, _Party_partyLeader, _Party_partyMembers, _Party_invitedMembers, _Party_partyMetadata, _Party_partyRegister;
import asyncForEach from '../../../lib/asyncForEach.js';
import log from '../../../lib/log.js';
import World from '../../world/World.js';
import PartyModel from '../../../db/models/PartyModel.js';
import PartyMetadata from './PartyMetadata.js';
import PartyMetadataError from './PartyMetadataError.js';
class Party {
    /**
     * Create a new party
     *
     * @param {PartyModel} model - the underlying database model
     */
    constructor(model) {
        _Party_partyLeader.set(this, void 0);
        _Party_partyMembers.set(this, void 0);
        _Party_invitedMembers.set(this, void 0);
        _Party_partyMetadata.set(this, void 0);
        this.world = World.getInstance();
        this.model = model;
        __classPrivateFieldSet(this, _Party_partyLeader, null, "f");
        __classPrivateFieldSet(this, _Party_partyMembers, [], "f");
        __classPrivateFieldSet(this, _Party_invitedMembers, [], "f");
        __classPrivateFieldSet(this, _Party_partyMetadata, new PartyMetadata(), "f");
    }
    /**
     * Retrieve a party
     *
     * @param {Character} character - The character who may be in a party
     */
    static getParty(character) {
        if (character.id in __classPrivateFieldGet(Party, _a, "f", _Party_partyRegister)) {
            return __classPrivateFieldGet(Party, _a, "f", _Party_partyRegister)[character.id];
        }
        return Object.values(__classPrivateFieldGet(Party, _a, "f", _Party_partyRegister)).find((party) => party.inParty(character));
    }
    /**
     * Get all parties we were invited to
     *
     * @param {Character} character - The invited character
     *
     * @returns {List<Party>}
     */
    static getInvitedParties(character) {
        return Object.values(__classPrivateFieldGet(Party, _a, "f", _Party_partyRegister)).filter((party) => party.isInvited(character));
    }
    /**
     * Factory method for creating parties given a party leader
     *
     * @param {Character} partyLeader - The leader of the party
     *
     * @returns {Party}
     */
    static createParty(partyLeader) {
        return __awaiter(this, void 0, void 0, function* () {
            if (partyLeader.id in __classPrivateFieldGet(Party, _a, "f", _Party_partyRegister)) {
                return __classPrivateFieldGet(Party, _a, "f", _Party_partyRegister)[partyLeader.id];
            }
            const model = new PartyModel();
            model.partyLeaderId = partyLeader.id;
            model.partyMembers.push({ characterId: partyLeader.id });
            model.maxPartyMembers = Math.max(2, 2 + partyLeader.getAttributeModifier('charisma'));
            yield model.save();
            const party = new Party(model);
            yield party.load();
            __classPrivateFieldGet(Party, _a, "f", _Party_partyRegister)[partyLeader.id] = party;
            return party;
        });
    }
    /**
     * Save all parties in the registry
     */
    static save() {
        return __awaiter(this, void 0, void 0, function* () {
            yield asyncForEach(Object.values(__classPrivateFieldGet(Party, _a, "f", _Party_partyRegister)), (party) => __awaiter(this, void 0, void 0, function* () {
                yield party.save();
            }));
        });
    }
    /**
     * The total number of members in the party (invited or otherwise)
     *
     * @returns {Number}
     */
    get length() {
        return __classPrivateFieldGet(this, _Party_partyMembers, "f").length + __classPrivateFieldGet(this, _Party_invitedMembers, "f").length;
    }
    /**
     * The party leader
     *
     * @returns {Character}
     */
    get leader() {
        return __classPrivateFieldGet(this, _Party_partyLeader, "f");
    }
    /**
     * Add an invitee as a member
     *
     * @param {Character} character - The character to invite
     *
     * @returns {Boolean}
     */
    addInvitee(character) {
        if (this.length >= this.model.maxPartyMembers) {
            return false;
        }
        // Don't invite twice
        if (__classPrivateFieldGet(this, _Party_invitedMembers, "f").includes(character)) {
            return true;
        }
        __classPrivateFieldGet(this, _Party_invitedMembers, "f").push(character);
        return true;
    }
    /**
     * Remove an invited character without adding them as a member
     *
     * @param {Character} character - The character to invite
     */
    removeInvitee(character) {
        const invitedIndex = __classPrivateFieldGet(this, _Party_invitedMembers, "f").indexOf(character);
        if (invitedIndex > -1) {
            __classPrivateFieldGet(this, _Party_invitedMembers, "f").splice(invitedIndex, 1);
        }
    }
    /**
     * Add a character as a member
     *
     * @param {Character} character - The character to add
     *
     * @returns {Boolean}
     */
    addMember(character) {
        const invitedIndex = __classPrivateFieldGet(this, _Party_invitedMembers, "f").indexOf(character);
        if (invitedIndex === -1 && this.length >= this.model.maxPartyMembers) {
            return false;
        }
        else if (invitedIndex > -1 && this.length - 1 >= this.model.maxPartyMembers) {
            return false;
        }
        if (__classPrivateFieldGet(this, _Party_partyMembers, "f").includes(character)) {
            return true;
        }
        if (invitedIndex > -1) {
            __classPrivateFieldGet(this, _Party_invitedMembers, "f").splice(invitedIndex, 1);
        }
        __classPrivateFieldGet(this, _Party_partyMembers, "f").push(character);
        return true;
    }
    /**
     * Remove a character as a member
     *
     * @param {Character} character - The character to remove
     *
     * This will only return false on an error. A character not in the party is
     * a collective shrug.
     *
     * @returns {Boolean}
     */
    removeMember(character) {
        if (character === this.leader) {
            return false;
        }
        const memberIndex = __classPrivateFieldGet(this, _Party_partyMembers, "f").indexOf(character);
        if (memberIndex > -1) {
            __classPrivateFieldGet(this, _Party_partyMembers, "f").splice(memberIndex, 1);
        }
        return true;
    }
    /**
     * Test if a character is in a party
     *
     * @param {Character} character - The character who may be in a party
     *
     * @return {Boolean}
     */
    inParty(character) {
        return __classPrivateFieldGet(this, _Party_partyMembers, "f").includes(character);
    }
    /**
     * Test if a character was invited to the party
     *
     * @param {Character} character - The character who may be invited
     *
     * @returns {Boolean}
     */
    isInvited(character) {
        return __classPrivateFieldGet(this, _Party_invitedMembers, "f").includes(character);
    }
    /**
     * Add experience to the party
     *
     * @param {Character} character      - The character who contributed the experience
     * @param {Number}    encounterLevel - The level of the encounter
     */
    addExperience(character, encounterLevel) {
        const validMembers = __classPrivateFieldGet(this, _Party_partyMembers, "f").filter((c) => c.room === character.room);
        const modifier = __classPrivateFieldGet(this, _Party_partyMembers, "f").length;
        validMembers.forEach((member) => {
            member.addExperience(encounterLevel, modifier);
        });
    }
    /**
     * Record a kill across a party
     *
     * This is a little bit interesting. We don't give credit for killing something
     * to the other party members, but we do want to track the 'effect' of killing
     * the creature on them. In this particular case, we're going to trigger the
     * 'kill' event on the other party members if they're in the same room.
     *
     * @param {Character} killingCharacter - The character who did the deed
     * @param {Character} killedCharacter  - The character who suffered the deed
     */
    addKill(killingCharacter, killedCharacter) {
        const validMembers = __classPrivateFieldGet(this, _Party_partyMembers, "f").filter((c) => c.room === killingCharacter.room && c !== killingCharacter);
        killingCharacter.addKill(killedCharacter);
        validMembers.forEach((member) => {
            member.emit('kill', member, killedCharacter);
        });
    }
    /**
     * Apply an effect via callback function to all party members
     *
     * @param {Function} callback - The callback to invoke. Will be passed each party member.
     */
    applyEffect(callback) {
        __classPrivateFieldGet(this, _Party_partyMembers, "f").forEach(member => {
            callback(member);
        });
    }
    /**
     * Set a property on the party
     *
     * @param {Character} character - The invoking character
     * @param {Object}    property  - The property they are setting
     *
     * @throws {PartyMetadataError}
     */
    setProperty(character, property) {
        const targetVal = property.target;
        if (targetVal) {
            const target = __classPrivateFieldGet(this, _Party_partyMembers, "f").find((c) => c.name.toLowerCase() === targetVal.toLowerCase());
            if (!target) {
                throw new PartyMetadataError(`${targetVal} is not a member of the party.`);
            }
            property.target = target;
        }
        __classPrivateFieldGet(this, _Party_partyMetadata, "f").set(character, property);
    }
    /**
     * Destroy the party
     *
     * The party is *not* safe to use once this method is called.
     *
     * @param {Boolean} sendMessages - Notify the characters in the party that
     *                                 the party has ended
     */
    destroy(sendMessages = false) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!__classPrivateFieldGet(this, _Party_partyLeader, "f")) {
                return;
            }
            if (__classPrivateFieldGet(this, _Party_partyLeader, "f").id in __classPrivateFieldGet(Party, _a, "f", _Party_partyRegister)) {
                delete __classPrivateFieldGet(Party, _a, "f", _Party_partyRegister)[__classPrivateFieldGet(this, _Party_partyLeader, "f").id];
            }
            if (sendMessages) {
                __classPrivateFieldGet(this, _Party_partyLeader, "f").sendImmediate('You have disbanded your party.');
                __classPrivateFieldGet(this, _Party_partyMembers, "f").forEach((member) => {
                    if (member !== __classPrivateFieldGet(this, _Party_partyLeader, "f")) {
                        member.sendImmediate(`${__classPrivateFieldGet(this, _Party_partyLeader, "f").toShortText()} has disbanded the party.`);
                    }
                });
                __classPrivateFieldGet(this, _Party_invitedMembers, "f").forEach((invitee) => {
                    invitee.sendImmediate(`${__classPrivateFieldGet(this, _Party_partyLeader, "f").toShortText()} has disbanded their party.`);
                });
            }
            // Prevent accessing any other information about the party, just in case
            __classPrivateFieldSet(this, _Party_partyMembers, [], "f");
            __classPrivateFieldSet(this, _Party_invitedMembers, [], "f");
            __classPrivateFieldSet(this, _Party_partyLeader, null, "f");
            yield PartyModel.deleteOne({ _id: this.model._id });
        });
    }
    /**
     * Convert the party into JSON suitable for sending as a message
     *
     * @returns {Object}
     */
    toJson() {
        const message = {
            size: __classPrivateFieldGet(this, _Party_partyMembers, "f").length,
            maxSize: this.model.maxPartyMembers,
            leader: {
                name: __classPrivateFieldGet(this, _Party_partyLeader, "f").toShortText(),
                classes: __classPrivateFieldGet(this, _Party_partyLeader, "f").classes.map((c) => c.toJson()),
                metadata: __classPrivateFieldGet(this, _Party_partyMetadata, "f").toJson(__classPrivateFieldGet(this, _Party_partyLeader, "f")),
            },
            members: __classPrivateFieldGet(this, _Party_partyMembers, "f").filter((m) => m !== __classPrivateFieldGet(this, _Party_partyLeader, "f")).map((member) => {
                return {
                    name: member.toShortText(),
                    classes: member.classes.map((c) => c.toJson()),
                    metadata: __classPrivateFieldGet(this, _Party_partyMetadata, "f").toJson(member),
                };
            }),
        };
        return message;
    }
    /**
     * Load the party into memory
     */
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            __classPrivateFieldSet(this, _Party_partyLeader, this.world.characters.find((c) => this.model.partyLeaderId.equals(c.id)), "f");
            if (!__classPrivateFieldGet(this, _Party_partyLeader, "f")) {
                log.warn({ partyLeaderId: this.model.partyLeaderId.toString() }, 'Unable to find party leader in world');
                return;
            }
            this.model.partyMembers.forEach((partyMember) => {
                const character = this.world.characters.find((c) => partyMember.characterId.equals(c.id));
                if (!character) {
                    log.warn({ partyMemberId: partyMember.characterId }, 'Unable to find party member in world');
                }
                else {
                    __classPrivateFieldGet(this, _Party_partyMembers, "f").push(character);
                }
            });
            this.model.invitedMemberIds.forEach((characterId) => {
                const character = this.world.characters.find((c) => characterId.toString() === c.id);
                if (!character) {
                    log.warn({ invitedMemberId: characterId }, 'Unable to find invited member in world');
                }
                else {
                    __classPrivateFieldGet(this, _Party_invitedMembers, "f").push(character);
                }
            });
            if (!(__classPrivateFieldGet(this, _Party_partyLeader, "f").id in __classPrivateFieldGet(Party, _a, "f", _Party_partyRegister))) {
                __classPrivateFieldGet(Party, _a, "f", _Party_partyRegister)[__classPrivateFieldGet(this, _Party_partyLeader, "f").id] = this;
            }
        });
    }
    /**
     * Save the party
     */
    save() {
        return __awaiter(this, void 0, void 0, function* () {
            if (__classPrivateFieldGet(this, _Party_partyLeader, "f")) {
                this.model.partyLeaderId = __classPrivateFieldGet(this, _Party_partyLeader, "f").id;
            }
            this.model.partyMembers = __classPrivateFieldGet(this, _Party_partyMembers, "f").map((partyMember) => {
                return {
                    characterId: partyMember.id,
                };
            });
            this.model.invitedMemberIds = __classPrivateFieldGet(this, _Party_invitedMembers, "f").map((member) => member.id);
            this.model.save();
        });
    }
}
_a = Party, _Party_partyLeader = new WeakMap(), _Party_partyMembers = new WeakMap(), _Party_invitedMembers = new WeakMap(), _Party_partyMetadata = new WeakMap();
_Party_partyRegister = { value: {} };
export default Party;
