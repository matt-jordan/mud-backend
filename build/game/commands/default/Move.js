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
exports.MoveFactory = exports.MoveAction = void 0;
const Error_js_1 = require("./Error.js");
const log_js_1 = __importDefault(require("../../../lib/log.js"));
/**
 * @module game/commands/default/Move
 */
/**
 * An action that moves the player
 */
class MoveAction {
    /**
     * Construct a new move action
     *
     * @param {Object} options - Specify how the player will move
     * @param {string} options.direction - The direction the player will move in
     */
    constructor(options) {
        this.direction = options.direction;
    }
    /**
     * Execute the action on the player
     *
     * @param {Character} character - The character to execute on
     */
    async execute(character) {
        if (!character.room) {
            character.sendImmediate('You are floating in a void');
            return;
        }
        const startRoom = character.room;
        if (!(this.direction in startRoom.exits)) {
            character.sendImmediate('There is nothing in that direction.');
            return;
        }
        const exit = startRoom.exits[this.direction];
        if (!exit.destinationId) {
            character.sendImmediate('You bounce off an immovable force.');
            return;
        }
        if (exit.door && !exit.door.isOpen) {
            character.sendImmediate(`You cannot move through ${exit.door.toShortText()}`);
            return;
        }
        const destinationRoom = character.world.findRoomById(exit.destinationId);
        if (!destinationRoom) {
            log_js_1.default.warn({
                action: this,
                characterId: character.id,
                roomId: exit.destinationId,
            }, 'Destination room not found in area');
            character.sendImmediate('You bounce off an immovable force.');
            return;
        }
        log_js_1.default.debug({ characterId: character.id, roomId: destinationRoom.id }, 'Moving character to room');
        character.moveToRoom(destinationRoom);
    }
}
exports.MoveAction = MoveAction;
/**
 * Factory that generates MoveAction objects
 */
class MoveFactory {
    /**
     * The mapping of this factory to the player command
     *
     * @return {String}
     */
    static get name() {
        return 'move';
    }
    /**
     * Create a new factory
     */
    constructor() {
        this.options = [
            'north',
            'south',
            'west',
            'east',
            'up',
            'down',
            'northwest',
            'northeast',
            'southwest',
            'southeast',
        ];
    }
    /**
     * Generate a MoveAction from the provided player input
     *
     * @param {Array.<String>} tokens - The text the player provided
     *
     * @return {MoveAction} On success, the action to execute, or null
     */
    generate(tokens) {
        if (tokens.length !== 1) {
            return new Error_js_1.ErrorAction({ message: 'Where do you want to move?' });
        }
        const direction = this.options.find((option) => option === tokens[0]);
        if (!direction) {
            return new Error_js_1.ErrorAction({ message: `'${tokens[0]}' is not a valid direction.` });
        }
        return new MoveAction({ direction });
    }
}
exports.MoveFactory = MoveFactory;
