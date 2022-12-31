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
const mongoose_1 = __importDefault(require("mongoose"));
const loaderSchema_js_1 = __importDefault(require("./schemas/loaderSchema.js"));
const RoomModel_js_1 = __importDefault(require("./RoomModel.js"));
const asyncForEach_js_1 = __importDefault(require("../../lib/asyncForEach.js"));
const log_js_1 = __importDefault(require("../../lib/log.js"));
;
;
;
;
const areaSchema = new mongoose_1.default.Schema({
    name: { type: String, required: true },
    roomIds: [{ type: mongoose_1.default.Schema.Types.ObjectId }],
    loadInfo: { type: loaderSchema_js_1.default, default: (val) => ({ loadId: '', version: 0 }) },
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
areaSchema.method('updateFromLoad', async function (loadedObject) {
    if (this.loadInfo.version >= loadedObject.version) {
        return;
    }
    if (this.loadInfo.loadId !== loadedObject.loadId) {
        return;
    }
    this.name = loadedObject.name;
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
areaSchema.method('updateFromLoadRefs', async function (loadedObject) {
    if (this.loadInfo.version >= loadedObject.version) {
        return;
    }
    if (this.loadInfo.loadId !== loadedObject.loadId) {
        return;
    }
    const roomIds = [];
    await (0, asyncForEach_js_1.default)(loadedObject.roomLoadIds, async (roomLoadId) => {
        const room = await RoomModel_js_1.default.findByLoadId(roomLoadId);
        if (!room) {
            log_js_1.default.error({ areaId: this._id, roomLoadId: roomLoadId }, 'Unable to find room');
            return;
        }
        roomIds.push(room._id);
    });
    if (roomIds.length !== loadedObject.roomLoadIds.length) {
        throw new Error(`Unable to load all rooms for area ${this._id}`);
    }
    this.roomIds = [...roomIds];
});
const AreaModel = mongoose_1.default.model('Area', areaSchema);
exports.default = AreaModel;
