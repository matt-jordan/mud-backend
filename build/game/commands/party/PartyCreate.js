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
 * @module game/commands/party/PartyCreate
 */
/**
 * An action that causes you to create a party
 */
class PartyCreate {
    /**
     * Create a new PartyCreate action
     */
    constructor() {
    }
    /**
     * Create a new party based on the character
     */
    execute(character) {
        return __awaiter(this, void 0, void 0, function* () {
            const party = Party.getParty(character);
            if (party) {
                if (party.leader === character) {
                    character.sendImmediate('You are already leading a party.');
                }
                else {
                    character.sendImmediate(`You are already in ${party.leader.toShortText()}'s party.`);
                }
                return;
            }
            yield Party.createParty(character);
            character.sendImmediate('You form a party.');
        });
    }
}
export { PartyCreate };
