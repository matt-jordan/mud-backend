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
import RoomModel from './RoomModel.js';
import asyncForEach from '../../lib/asyncForEach.js';
import log from '../../lib/log.js';
;
;
;
;
const areaSchema = new mongoose.Schema({
    name: { type: String, required: true },
    roomIds: [{ type: mongoose.Schema.Types.ObjectId }],
    loadInfo: { type: loaderSchema, default: (val) => ({ loadId: '', version: 0 }) },
}, {
    timestamps: true,
});
areaSchema.static('findByLoadId', function findByLoadId(loadId) {
    return AreaModel.findOne({ 'loadInfo.loadId': loadId });
});
/**
 * Update this object from the externally loaded object
 *
 * Note that this does not save the RoomModel.
 *
 * @param {IAreaLoadModel} loadedObject - The externally provided object
 */
areaSchema.method('updateFromLoad', function (loadedObject) {
    return __awaiter(this, void 0, void 0, function* () {
        if (this.loadInfo.version >= loadedObject.version) {
            return;
        }
        if (this.loadInfo.loadId !== loadedObject.loadId) {
            return;
        }
        this.name = loadedObject.name;
    });
});
/**
 * Post-process any IDs that were referenced by the externally loaded object
 *
 * In order to prevent ordering issues, loading an external object first loads
 * all the properties that have to exist (see updateFromLoad). It then updates
 * properties in this method that reference other objects.
 *
 * Note that this does not save the RoomModel.
 *
 * @param {IAreaLoadModel} loadedObject - The externally provided object
 */
areaSchema.method('updateFromLoadRefs', function (loadedObject) {
    return __awaiter(this, void 0, void 0, function* () {
        if (this.loadInfo.version >= loadedObject.version) {
            return;
        }
        if (this.loadInfo.loadId !== loadedObject.loadId) {
            return;
        }
        const roomIds = [];
        yield asyncForEach(loadedObject.roomLoadIds, (roomLoadId) => __awaiter(this, void 0, void 0, function* () {
            const room = yield RoomModel.findByLoadId(roomLoadId);
            if (!room) {
                log.error({ areaId: this._id, roomLoadId: roomLoadId }, 'Unable to find room');
                return;
            }
            roomIds.push(room._id);
        }));
        if (roomIds.length !== loadedObject.roomLoadIds.length) {
            throw new Error(`Unable to load all rooms for area ${this._id}`);
        }
        this.roomIds = [...roomIds];
    });
});
const AreaModel = mongoose.model('Area', areaSchema);
export default AreaModel;
