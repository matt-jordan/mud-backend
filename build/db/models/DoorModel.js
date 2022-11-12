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
const doorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    isOpen: { type: Boolean, default: false },
    hasLock: { type: Boolean, default: false },
    lockInfo: {
        isLocked: { type: Boolean, default: false },
        skillDC: { type: Number, default: 0 },
        inanimateId: { type: String }, // key
    },
    weight: { type: Number, default: 75 },
    durability: {
        current: { type: Number, default: 25 },
        base: { type: Number, default: 25 },
    },
    loadInfo: { type: loaderSchema, default: (val) => ({ loadId: '', version: 0 }) },
});
/**
 * Find a Door by its external provided loadId
 *
 * @param {String} loadId - The unique ID of the door
 *
 * @returns Promise<DoorModel>
 */
doorSchema.static('findByLoadId', function (loadId) {
    return __awaiter(this, void 0, void 0, function* () {
        return DoorModel.findOne({ 'loadInfo.loadId': loadId });
    });
});
/**
 * Update this object from the externally loaded object
 *
 * Note that this does not save the RoomModel.
 *
 * @param {IDoorLoadModel} loadedObject - The externally provided object
 */
doorSchema.method('updateFromLoad', function (loadedObject) {
    var _a, _b, _c, _d;
    return __awaiter(this, void 0, void 0, function* () {
        if (this.loadInfo.version >= loadedObject.version) {
            return;
        }
        if (this.loadInfo.loadId !== loadedObject.loadId) {
            return;
        }
        this.name = loadedObject.name;
        this.description = loadedObject.description;
        this.hasLock = (_a = loadedObject.hasLock) !== null && _a !== void 0 ? _a : false;
        this.lockInfo.skillDC = (_b = loadedObject.skillDC) !== null && _b !== void 0 ? _b : 0;
        if (loadedObject.inanimateId) {
            this.lockInfo.inanimateId = loadedObject.inanimateId;
        }
        this.weight = (_c = loadedObject.weight) !== null && _c !== void 0 ? _c : 75;
        this.durability.base = (_d = loadedObject.durability) !== null && _d !== void 0 ? _d : 25;
        this.durability.current = this.durability.base;
    });
});
/**
 * Post-process any IDs that were referenced by the externally loaded object
 *
 * In order to prevent ordering issues, loading an external object first loads
 * all the properties that have to exist (see updateFromLoad). It then updates
 * properties in this method that reference other objects.
 *
 * @param {IDoorLoadModel} loadedObject - The externally provided object
 */
doorSchema.method('updateFromLoadRefs', function (loadedObject) {
    return __awaiter(this, void 0, void 0, function* () {
        if (this.loadInfo.version >= loadedObject.version) {
            return;
        }
        if (this.loadInfo.loadId !== loadedObject.loadId) {
            return;
        }
    });
});
const DoorModel = mongoose.model('Door', doorSchema);
export default DoorModel;
