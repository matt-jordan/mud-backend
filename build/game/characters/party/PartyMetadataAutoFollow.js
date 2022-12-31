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
const PartyMetadataError_js_1 = __importDefault(require("./PartyMetadataError.js"));
const log_js_1 = __importDefault(require("../../../lib/log.js"));
/**
 * A handler for setting up auto-follow on a character
 */
class PartyMetadataAutoFollow {
    /**
     * Create a new PartyMetadataAutoFollow
     */
    constructor() {
    }
    /**
     * Validate the settings based on the current state of the metadata
     *
     * @param {Character} character         - The character setting the metadata
     * @param {Object}    newValue
     * @param {String}    newValue.value    - The value
     * @param {Character} newValue.[target] - Optional. Target to set.
     * @param {Object}    oldValue
     * @param {String}    oldValue.value    - The old value
     * @param {Character} oldValue.[target] - Optional. Previous target.
     *
     * @throws {PartyMetadataError}
     */
    validate(character, newValue, oldValue) {
        const { value: newSetting, target: newTarget = null } = newValue;
        const { target: oldTarget = null } = oldValue;
        if (newSetting !== 'on' && newSetting !== 'off') {
            throw new PartyMetadataError_js_1.default(`Invalid setting '${newSetting}' for auto-follow.`);
        }
        if (newSetting === 'off' && !oldTarget) {
            throw new PartyMetadataError_js_1.default('You are not following anyone.');
        }
        if (newSetting === 'on') {
            if (!newTarget) {
                throw new PartyMetadataError_js_1.default('You must provide a valid party member to auto-follow.');
            }
            if (newTarget === oldTarget) {
                throw new PartyMetadataError_js_1.default(`You are already following '${newTarget.toShortText()}'.`);
            }
            if (newTarget === character) {
                throw new PartyMetadataError_js_1.default('You cannot follow yourself.');
            }
        }
    }
    /**
     * Validate the settings based on the current state of the metadata
     *
     * @param {Character} character         - The character setting the metadata
     * @param {Object}    newValue
     * @param {String}    newValue.value    - The value
     * @param {Character} newValue.[target] - Optional. Target to set.
     * @param {Object}    oldValue
     * @param {String}    oldValue.value    - The old value
     * @param {Character} oldValue.[target] - Optional. Previous target.
     */
    create(character, newValue, oldValue) {
        const { value: newSetting, target: newTarget = null } = newValue;
        const { target: oldTarget = null, callback: oldCallback = null } = oldValue;
        const moveCallback = (followedCharacter, oldRoom, newRoom) => {
            if (oldRoom !== character.room) {
                log_js_1.default.debug({ roomId: character.room.id, followedCharacterRoomId: oldRoom.id }, 'Not auto-following: followed character room is not our room');
                return;
            }
            log_js_1.default.debug({ characterId: character.id, followedCharacterId: followedCharacter.id }, 'Auto-following character');
            character.moveToRoom(newRoom);
        };
        if (oldTarget && oldCallback) {
            log_js_1.default.debug({ characterId: character.id }, `Character is no longer auto-following ${oldTarget.id}`);
            character.sendImmediate(`You are no longer following '${oldTarget.toShortText()}'.`);
            oldTarget.removeListener('move', oldCallback);
        }
        if (newSetting === 'on') {
            log_js_1.default.debug({ characterId: character.id }, `Character is now auto-following ${newTarget.id}`);
            character.sendImmediate(`You are now auto-following '${newTarget.toShortText()}'`);
            newTarget.on('move', moveCallback);
        }
        return {
            value: newSetting,
            target: newTarget,
            callback: moveCallback,
        };
    }
    /**
     * Convert metadata to JSON
     *
     * @param {Object} currentValue - The current value of the metadata
     *
     * @returns {Object}
     */
    toJson(currentValue) {
        const { value, target } = currentValue;
        if (value === 'on' && target) {
            return target.toShortText();
        }
        return null;
    }
}
exports.default = PartyMetadataAutoFollow;
