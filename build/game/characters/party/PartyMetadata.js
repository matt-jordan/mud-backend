//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _PartyMetadata_metadataStrategies, _PartyMetadata_metadata;
import PartyMetadataError from './PartyMetadataError.js';
import PartyMetadataAutoAttack from './PartyMetadataAutoAttack.js';
import PartyMetadataAutoFollow from './PartyMetadataAutoFollow.js';
/**
 * Container for party metadata
 */
class PartyMetadata {
    /**
     * Create new party metadata
     */
    constructor() {
        _PartyMetadata_metadataStrategies.set(this, void 0);
        _PartyMetadata_metadata.set(this, void 0);
        __classPrivateFieldSet(this, _PartyMetadata_metadata, {}, "f");
        __classPrivateFieldSet(this, _PartyMetadata_metadataStrategies, {
            'auto-attack': new PartyMetadataAutoAttack(),
            'auto-follow': new PartyMetadataAutoFollow(),
        }, "f");
    }
    /**
     * Set party metadata for the character
     *
     * @param {Character} character      - The character setting the metadata
     * @param {Object} metadata
     * @param {String} metadata.property - The name of the property being set
     * @param {String} metadata.value    - The string value
     * @param {String} [metadata.target] - Optional target being set
     *
     * @throws {PartyMetadataError}
     */
    set(character, metadata) {
        const { property, value, target = null } = metadata;
        // Throw here if we don't know what the property is
        if (!(property in __classPrivateFieldGet(this, _PartyMetadata_metadataStrategies, "f"))) {
            throw new PartyMetadataError(`${property} is not a valid party setting.`);
        }
        if (!(character.id in __classPrivateFieldGet(this, _PartyMetadata_metadata, "f"))) {
            __classPrivateFieldGet(this, _PartyMetadata_metadata, "f")[character.id] = {};
        }
        if (!(property in __classPrivateFieldGet(this, _PartyMetadata_metadata, "f")[character.id])) {
            __classPrivateFieldGet(this, _PartyMetadata_metadata, "f")[character.id][property] = {};
        }
        const newValue = { value, target };
        const oldValue = __classPrivateFieldGet(this, _PartyMetadata_metadata, "f")[character.id][property];
        __classPrivateFieldGet(this, _PartyMetadata_metadataStrategies, "f")[property].validate(character, newValue, oldValue);
        const createdValue = __classPrivateFieldGet(this, _PartyMetadata_metadataStrategies, "f")[property].create(character, newValue, oldValue);
        __classPrivateFieldGet(this, _PartyMetadata_metadata, "f")[character.id][property] = createdValue;
    }
    /**
     * Convert the metadata to JSON
     *
     * @param {Character} character - The character to get metadata for
     *
     * @returns {Object}
     */
    toJson(character) {
        return Object.keys(__classPrivateFieldGet(this, _PartyMetadata_metadataStrategies, "f")).map(property => {
            if (!__classPrivateFieldGet(this, _PartyMetadata_metadata, "f")[character.id] || !__classPrivateFieldGet(this, _PartyMetadata_metadata, "f")[character.id][property]) {
                return null;
            }
            const value = __classPrivateFieldGet(this, _PartyMetadata_metadataStrategies, "f")[property].toJson(__classPrivateFieldGet(this, _PartyMetadata_metadata, "f")[character.id][property]);
            if (value) {
                return { property, value };
            }
            return null;
        }).filter(e => e);
    }
}
_PartyMetadata_metadataStrategies = new WeakMap(), _PartyMetadata_metadata = new WeakMap();
export default PartyMetadata;
