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
import mongoose from 'mongoose';
import loaderSchema from './schemas/loaderSchema.js';
;
;
;
;
const factionSchema = new mongoose.Schema({
    name: { type: String, required: true },
    opposingFactions: [{ type: String }],
    supportingFactions: [{ type: String }],
    positiveModifier: { type: Number, default: 1 },
    negativeModifier: { type: Number, default: 1 },
    startingValue: { type: Number, default: 50 },
    loadInfo: { type: loaderSchema, default: (val) => ({ loadId: '', version: 0 }) },
});
/**
 * Find a Faction by its external provided loadId
 *
 * @param {String} loadId - The unique ID of the door
 *
 * @returns {FactionModel}
 */
factionSchema.static('findByLoadId', function (loadId) {
    return __awaiter(this, void 0, void 0, function* () {
        return FactionModel.findOne({ 'loadInfo.loadId': loadId });
    });
});
/**
 * Update this object from the externally loaded object
 *
 * Note that this does not save the FactionModel.
 *
 * @param {Object} loadedObject - The externally provided object
 */
factionSchema.method('updateFromLoad', function (loadedObject) {
    var _a, _b, _c, _d, _e;
    return __awaiter(this, void 0, void 0, function* () {
        if (this.loadInfo.version >= loadedObject.version) {
            return;
        }
        if (this.loadInfo.loadId !== loadedObject.loadId) {
            return;
        }
        this.name = loadedObject.name;
        this.supportingFactions = [...((_a = loadedObject.supportingFactions) !== null && _a !== void 0 ? _a : [])];
        this.opposingFactions = [...((_b = loadedObject.opposingFactions) !== null && _b !== void 0 ? _b : [])];
        this.positiveModifier = (_c = loadedObject.positiveModifier) !== null && _c !== void 0 ? _c : 1;
        this.negativeModifier = (_d = loadedObject.negativeModifier) !== null && _d !== void 0 ? _d : 1;
        this.startingValue = (_e = loadedObject.startingValue) !== null && _e !== void 0 ? _e : 50;
    });
});
/**
 * Post-process any IDs that were referenced by the externally loaded object
 *
 * In order to prevent ordering issues, loading an external object first loads
 * all the properties that have to exist (see updateFromLoad). It then updates
 * properties in this method that reference other objects.
 *
 * @param {Object} loadedObject - The externally provided object
 */
factionSchema.method('updateFromLoadRefs', function (loadedObject) {
    return __awaiter(this, void 0, void 0, function* () {
        if (this.loadInfo.version >= loadedObject.version) {
            return;
        }
        if (this.loadInfo.loadId !== loadedObject.loadId) {
            return;
        }
    });
});
const FactionModel = mongoose.model('Faction', factionSchema);
export default FactionModel;
