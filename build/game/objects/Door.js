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
/**
 * @module game/objects/Door
 */
/**
 * A door that exists between two rooms
 */
class Door {
    /**
     * Constructor
     *
     * @param {DoorModel} model - The model for this door
     */
    constructor(model) {
        this.model = model;
    }
    /**
     * The unique ID of the door
     *
     * @return {String}
     */
    get id() {
        return this.model._id;
    }
    /**
     * The name of the door
     *
     * @return {String}
     */
    get name() {
        return this.model.name;
    }
    /**
     * Whether or not the door is open
     *
     * @return {Boolean}
     */
    get isOpen() {
        return this.model.isOpen;
    }
    /**
     * Whether or not the door is open
     *
     * @param {Boolean} value
     */
    set isOpen(value) {
        this.model.isOpen = value;
    }
    /**
     * Whether or not the door has a lock
     *
     * @returns {Boolean}
     */
    get hasLock() {
        return this.model.hasLock;
    }
    /**
     * Whether or not the door is locked
     *
     * @returns {Boolean}
     */
    get isLocked() {
        if (!this.model.lockInfo) {
            return false;
        }
        return this.model.lockInfo.isLocked;
    }
    /**
     * Whether or not the door is locked
     *
     * @param {Boolean} value
     */
    set isLocked(value) {
        if (this.model.lockInfo) {
            this.model.lockInfo.isLocked = value;
        }
    }
    /**
     * The friendly ID of the key that unlocks this door
     *
     * @returns {String}
     */
    get keyInanimateId() {
        if (!this.model.lockInfo) {
            return '';
        }
        return this.model.lockInfo.inanimateId;
    }
    /**
     * Provide a short friendly text for this door
     *
     * @returns {String}
     */
    toShortText() {
        return this.name;
    }
    /**
     * A long description of the door
     *
     * @returns {String}
     */
    toLongText(character = null) {
        let description = this.model.description;
        if (character) {
            description += `\nThe door is ${this.isOpen ? 'open' : 'closed'}.`;
            if (this.hasLock) {
                description += ` It is ${this.isLocked ? 'locked' : 'unlocked'}.`;
            }
        }
        return description;
    }
    /**
     * Have a character open this door
     *
     * @param {Character} character - The character opening the door
     */
    open(character) {
        if (this.isOpen) {
            character.sendImmediate(`The ${this.toShortText()} is already open.`);
            return;
        }
        if (this.hasLock && this.isLocked) {
            character.sendImmediate(`The ${this.toShortText()} is locked.`);
            return;
        }
        this.isOpen = true;
        character.sendImmediate(`You open the ${this.toShortText()}.`);
        character.room.sendImmediate([character], `${character.toShortText()} opens the ${this.toShortText()}.`);
    }
    /**
     * Have a character close the door
     *
     * @param {Character} character - The character closing the door
     */
    close(character) {
        if (!this.isOpen) {
            character.sendImmediate(`The ${this.toShortText()} is already closed.`);
            return;
        }
        this.isOpen = false;
        character.sendImmediate(`You close the ${this.toShortText()}.`);
        character.room.sendImmediate([character], `${character.toShortText()} closes the ${this.toShortText()}.`);
    }
    /**
     * Unlock the door using the provided object
     *
     * @param {Character} character - The character performing the action
     * @param {Inanimate} key       - The key object
     */
    unlock(character, key) {
        if (this.isOpen) {
            character.sendImmediate(`The ${this.toShortText()} is already open.`);
            return;
        }
        if (!this.hasLock) {
            character.sendImmediate(`The ${this.toShortText()} has no lock.`);
            return;
        }
        if (!this.isLocked) {
            character.sendImmediate(`The ${this.toShortText()} is already unlocked.`);
            return;
        }
        if (this.keyInanimateId !== key.inanimateId) {
            character.sendImmediate(`${key.toShortText()} does not work with ${this.toShortText()}`);
            return;
        }
        this.isLocked = false;
        character.sendImmediate(`You unlock ${this.toShortText()} with ${key.toShortText()}`);
        character.room.sendImmediate([character], `${character.toShortText()} unlocks ${this.toShortText()}`);
    }
    /**
     * Lock the door using the provided object
     *
     * @param {Character} character - The character performing the action
     * @param {Inanimate} key       - The key object
     */
    lock(character, key) {
        if (this.isOpen) {
            character.sendImmediate(`The ${this.toShortText()} is open. You will need to close it before you can lock it.`);
            return;
        }
        if (!this.hasLock) {
            character.sendImmediate(`The ${this.toShortText()} has no lock.`);
            return;
        }
        if (this.isLocked) {
            character.sendImmediate(`The ${this.toShortText()} is already locked.`);
            return;
        }
        if (this.keyInanimateId !== key.inanimateId) {
            character.sendImmediate(`${key.toShortText()} does not work with ${this.toShortText()}`);
            return;
        }
        this.isLocked = true;
        character.sendImmediate(`You lock ${this.toShortText()} with ${key.toShortText()}`);
        character.room.sendImmediate([character], `${character.toShortText()} locks ${this.toShortText()}`);
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            // Not sure if anything needs to happen here yet
        });
    }
    save() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.model.save();
        });
    }
}
export default Door;
