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
import Party from '../../characters/party/Party.js';
/**
 * @module game/commands/party/PartyAccept
 */
/**
 * An action that causes you to leave a party
 */
class PartyAccept {
    /**
     * Create a new PartyAccept action
     *
     * @param {String} target - The invite to accept
     */
    constructor(target) {
        this.target = target;
    }
    /**
     * Execute the command on the character
     *
     * @param {Character} character - The character who executed the command
     */
    execute(character) {
        return __awaiter(this, void 0, void 0, function* () {
            const parties = Party.getInvitedParties(character);
            if (!parties || parties.length === 0) {
                character.sendImmediate('You have not been invited to any parties.');
                return;
            }
            const targetParty = parties.find(p => p.leader.name.toLowerCase() === this.target.toLowerCase());
            if (!targetParty) {
                character.sendImmediate(`You do not have an invite to join ${this.target}'s party.`);
                return;
            }
            if (!targetParty.addMember(character)) {
                character.sendImmediate(`You cannot join ${this.target}'s party; it is full!`);
                targetParty.leader.sendImmediate(`${character.toShortText()} cannot join your party; it is full!`);
                return;
            }
            character.sendImmediate(`You join ${this.target}'s party!`);
            targetParty.leader.sendImmediate(`${character.toShortText()} has joined your party!`);
            parties.filter(p => p !== targetParty).forEach((party) => {
                party.removeInvitee(character);
                party.leader.sendImmediate(`${character.toShortText()} has joined another party.`);
            });
        });
    }
}
export { PartyAccept };
