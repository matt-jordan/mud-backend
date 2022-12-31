"use strict";
//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
exports.PartyFactory = void 0;
const Error_js_1 = require("../default/Error.js");
const PartyAbandon_js_1 = require("./PartyAbandon.js");
const PartyAccept_js_1 = require("./PartyAccept.js");
const PartyCreate_js_1 = require("./PartyCreate.js");
const PartyDecline_js_1 = require("./PartyDecline.js");
const PartyInvite_js_1 = require("./PartyInvite.js");
const PartyLeave_js_1 = require("./PartyLeave.js");
const PartySet_js_1 = require("./PartySet.js");
const PartyStatus_js_1 = require("./PartyStatus.js");
/**
 * @module game/commands/party/PartyFactory
 */
/**
 * Factory for making party related commands
 */
class PartyFactory {
    /**
     * The name of the command that will trigger this factory
     *
     * @returns {String}
     */
    static get name() {
        return 'party';
    }
    /**
     * Create a new PartyFactory
     */
    constructor() {
    }
    /**
     * Generate new actions based on the tokens provided
     *
     * @param {List<String>} tokens - The user supplied tokens
     *
     * @returns {Object} - An action
     */
    generate(tokens) {
        if (!tokens || tokens.length === 0) {
            return new Error_js_1.ErrorAction({ message: 'What do you want to know about your party?', command: PartyFactory.name });
        }
        switch (tokens[0]) {
            case 'abandon':
                return new PartyAbandon_js_1.PartyAbandon();
            case 'accept':
                if (tokens.length === 1) {
                    return new Error_js_1.ErrorAction({ message: 'Which invite do you want to accept?', command: PartyFactory.name });
                }
                return new PartyAccept_js_1.PartyAccept(tokens.slice(1, tokens.length).join(' '));
            case 'create':
                return new PartyCreate_js_1.PartyCreate();
            case 'decline':
                if (tokens.length === 1) {
                    return new Error_js_1.ErrorAction({ message: 'Which invite do you want to decline?', command: PartyFactory.name });
                }
                return new PartyDecline_js_1.PartyDecline(tokens.slice(1, tokens.length).join(' '));
            case 'invite':
                if (tokens.length === 1) {
                    return new Error_js_1.ErrorAction({ message: 'Who do you want to invite to your party?', command: PartyFactory.name });
                }
                return new PartyInvite_js_1.PartyInvite(tokens.slice(1, tokens.length).join(' '));
            case 'leave':
                return new PartyLeave_js_1.PartyLeave();
            case 'set':
                {
                    if (tokens.length < 3) {
                        return new Error_js_1.ErrorAction({ message: 'What property do you want to set on your party?', command: PartyFactory.name });
                    }
                    let target;
                    if (tokens.length === 4) {
                        target = tokens[3];
                    }
                    return new PartySet_js_1.PartySet({ property: tokens[1], value: tokens[2], target });
                }
            case 'status':
                return new PartyStatus_js_1.PartyStatus();
            default:
                return new Error_js_1.ErrorAction({ message: `'${tokens[0]}' is not a valid party command.`, command: PartyFactory.name });
        }
    }
}
exports.PartyFactory = PartyFactory;
