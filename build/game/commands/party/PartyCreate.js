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
exports.PartyCreate = void 0;
const Party_js_1 = __importDefault(require("../../characters/party/Party.js"));
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
    async execute(character) {
        const party = Party_js_1.default.getParty(character);
        if (party) {
            if (party.leader === character) {
                character.sendImmediate('You are already leading a party.');
            }
            else {
                character.sendImmediate(`You are already in ${party.leader.toShortText()}'s party.`);
            }
            return;
        }
        await Party_js_1.default.createParty(character);
        character.sendImmediate('You form a party.');
    }
}
exports.PartyCreate = PartyCreate;
