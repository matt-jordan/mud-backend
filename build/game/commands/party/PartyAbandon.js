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
exports.PartyAbandon = void 0;
const Party_js_1 = __importDefault(require("../../characters/party/Party.js"));
/**
 * @module game/commands/party/PartyAbandon
 */
/**
 * An action that causes you to abandon a party
 */
class PartyAbandon {
    /**
     * Create a new PartyAbandon action
     */
    constructor() {
    }
    /**
     * Execute the command on the player
     *
     * @param {Character} character - The character to execute on
     */
    async execute(character) {
        const party = Party_js_1.default.getParty(character);
        if (!party || party.leader !== character) {
            character.sendImmediate('You are not leading a party.');
            return;
        }
        await party.destroy(true);
    }
}
exports.PartyAbandon = PartyAbandon;
