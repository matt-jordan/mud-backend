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
 * @module game/commands/party/PartyStatus
 */
/**
 * An action that shows your party status
 */
class PartyStatus {
    /**
     * Create a new PartyStatus action
     */
    constructor() {
    }
    /**
     * Display details about a party
     *
     * @param {Character} character - The character who wants to know their
     *                                party's status
     */
    execute(character) {
        return __awaiter(this, void 0, void 0, function* () {
            const party = Party.getParty(character);
            if (!party) {
                character.sendImmediate('You are not in a party.');
                return;
            }
            character.sendImmediate({ messageType: 'PartyStatus', message: party.toJson() });
        });
    }
}
export { PartyStatus };
