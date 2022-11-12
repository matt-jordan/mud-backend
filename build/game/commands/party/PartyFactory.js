//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------
import { ErrorAction } from '../default/Error.js';
import { PartyAbandon } from './PartyAbandon.js';
import { PartyAccept } from './PartyAccept.js';
import { PartyCreate } from './PartyCreate.js';
import { PartyDecline } from './PartyDecline.js';
import { PartyInvite } from './PartyInvite.js';
import { PartyLeave } from './PartyLeave.js';
import { PartySet } from './PartySet.js';
import { PartyStatus } from './PartyStatus.js';
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
            return new ErrorAction({ message: 'What do you want to know about your party?', command: PartyFactory.name });
        }
        switch (tokens[0]) {
            case 'abandon':
                return new PartyAbandon();
            case 'accept':
                if (tokens.length === 1) {
                    return new ErrorAction({ message: 'Which invite do you want to accept?', command: PartyFactory.name });
                }
                return new PartyAccept(tokens.slice(1, tokens.length).join(' '));
            case 'create':
                return new PartyCreate();
            case 'decline':
                if (tokens.length === 1) {
                    return new ErrorAction({ message: 'Which invite do you want to decline?', command: PartyFactory.name });
                }
                return new PartyDecline(tokens.slice(1, tokens.length).join(' '));
            case 'invite':
                if (tokens.length === 1) {
                    return new ErrorAction({ message: 'Who do you want to invite to your party?', command: PartyFactory.name });
                }
                return new PartyInvite(tokens.slice(1, tokens.length).join(' '));
            case 'leave':
                return new PartyLeave();
            case 'set':
                {
                    if (tokens.length < 3) {
                        return new ErrorAction({ message: 'What property do you want to set on your party?', command: PartyFactory.name });
                    }
                    let target;
                    if (tokens.length === 4) {
                        target = tokens[3];
                    }
                    return new PartySet({ property: tokens[1], value: tokens[2], target });
                }
            case 'status':
                return new PartyStatus();
            default:
                return new ErrorAction({ message: `'${tokens[0]}' is not a valid party command.`, command: PartyFactory.name });
        }
    }
}
export { PartyFactory };
