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
 * @module game/commands/party/PartyLeave
 */
/**
 * An action that causes you to leave a party
 */
class PartyLeave {
    /**
     * Create a new PartyLeave action
     */
    constructor() {
    }
    /**
     * Execute the command on the character
     *
     * @param {Character} character - The character executing the command
     */
    execute(character) {
        return __awaiter(this, void 0, void 0, function* () {
            const party = Party.getParty(character);
            if (!party) {
                character.sendImmediate('You are not in a party.');
                return;
            }
            if (party.leader === character) {
                character.sendImmediate('You cannot leave the party, you are leading it.');
                return;
            }
            if (!party.removeMember(character)) {
                character.sendImmediate(`You failed to leave ${party.leader.toShortText()}'s party.`);
                return;
            }
            character.sendImmediate(`You have left ${party.leader.toShortText()}'s party.`);
            party.leader.sendImmediate(`${character.toShortText()} has left your party.`);
        });
    }
}
export { PartyLeave };
