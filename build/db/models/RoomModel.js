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
const AreaModel_js_1 = __importDefault(require("./AreaModel.js"));
const DoorModel_js_1 = __importDefault(require("./DoorModel.js"));
const SpawnerModel_js_1 = __importDefault(require("./SpawnerModel.js"));
const loaderSchema_js_1 = __importDefault(require("./schemas/loaderSchema.js"));
const inanimateRefSchema_js_1 = __importDefault(require("./schemas/inanimateRefSchema.js"));
const asyncForEach_js_1 = __importDefault(require("../../lib/asyncForEach.js"));
const log_js_1 = __importDefault(require("../../lib/log.js"));
;
const portalSchema = new mongoose_1.default.Schema({
    direction: { type: String, required: true, enum: ['up', 'down', 'east', 'west', 'north', 'south', 'northeast', 'northwest', 'southeast', 'southwest'], },
    destinationId: { type: mongoose_1.default.Schema.Types.ObjectId, required: true },
    doorId: { type: mongoose_1.default.Schema.Types.ObjectId },
}, {
    timestamps: true,
});
;
;
;
;
const roomSchema = new mongoose_1.default.Schema({
    name: { type: String, required: true },
    areaId: { type: mongoose_1.default.Schema.Types.ObjectId },
    description: { type: String, default: '' },
    characterIds: [{ type: mongoose_1.default.Schema.Types.ObjectId }],
    inanimates: [{ type: inanimateRefSchema_js_1.default }],
    spawnerIds: [{ type: mongoose_1.default.Schema.Types.ObjectId }],
    exits: [{ type: portalSchema }],
    loadInfo: { type: loaderSchema_js_1.default, default: (val) => ({ loadId: '', version: 0 }) },
}, {
    timestamps: true,
});
/**
 * Find a Room by its external provided loadId
 *
 * @param {String} loadId - The unique ID of the room
 *
 * @returns {RoomModel}
 */
roomSchema.static('findByLoadId', async function (loadId) {
    return RoomModel.findOne({ 'loadInfo.loadId': loadId });
});
/**
 * Update this object from the externally loaded object
 *
 * Note that this does not save the RoomModel.
 *
 * @param {Object} loadedObject - The externally provided object
 */
roomSchema.method('updateFromLoad', async function (loadedObject) {
    if (this.loadInfo.version >= loadedObject.version) {
        return;
    }
    if (this.loadInfo.loadId !== loadedObject.loadId) {
        return;
    }
    this.name = loadedObject.name;
    this.description = loadedObject.description;
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
 * @param {Object} loadedObject - The externally provided object
 */
roomSchema.method('updateFromLoadRefs', async function (loadedObject) {
    if (this.loadInfo.version >= loadedObject.version) {
        return;
    }
    if (this.loadInfo.loadId !== loadedObject.loadId) {
        return;
    }
    if (loadedObject.areaLoadId) {
        const area = await AreaModel_js_1.default.findByLoadId(loadedObject.areaLoadId);
        if (!area) {
            log_js_1.default.error({ roomId: this._id, areaLoadId: loadedObject.areaLoadId }, 'Unable to find area');
            throw new Error(`Unable to find area: ${loadedObject.areaLoadId}`);
        }
        this.areaId = area._id;
    }
    const exits = [];
    await (0, asyncForEach_js_1.default)(loadedObject.exits, async (exit) => {
        const destinationRoom = await RoomModel.findByLoadId(exit.loadId);
        if (!destinationRoom) {
            log_js_1.default.error({ roomId: this._id, roomLoadId: exit.loadId }, 'Unable to find room');
            return;
        }
        const exitInfo = {
            direction: exit.direction,
            destinationId: destinationRoom._id,
        };
        if (exit.doorLoadId) {
            const door = await DoorModel_js_1.default.findByLoadId(exit.doorLoadId);
            if (!door) {
                log_js_1.default.error({ roomId: this._id, doorLoadId: exit.doorLoadId }, 'Unable to find door');
                return;
            }
            exitInfo.doorId = door._id;
        }
        exits.push(exitInfo);
    });
    if (exits.length !== loadedObject.exits?.length) {
        throw new Error(`Unable to load all exits for room ${this._id}`);
    }
    this.exits = [...exits];
    if (loadedObject.spawnerLoadIds) {
        const spawnerIds = [];
        await (0, asyncForEach_js_1.default)(loadedObject.spawnerLoadIds, async (spawnerLoadId) => {
            const spawner = await SpawnerModel_js_1.default.findByLoadId(spawnerLoadId);
            if (!spawner) {
                log_js_1.default.error({ roomId: this._id, spawnerLoadId }, 'Unable to find spawner');
                return;
            }
            spawnerIds.push(spawner._id);
        });
        if (spawnerIds.length !== loadedObject.spawnerLoadIds.length) {
            throw new Error(`Unable to load all spawners from room ${this._id}`);
        }
        this.spawnerIds = [...spawnerIds];
    }
});
const RoomModel = mongoose_1.default.model('Room', roomSchema);
exports.default = RoomModel;
