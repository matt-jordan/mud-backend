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
import AreaModel from './AreaModel.js';
import DoorModel from './DoorModel.js';
import SpawnerModel from './SpawnerModel.js';
import loaderSchema from './schemas/loaderSchema.js';
import inanimateRefSchema from './schemas/inanimateRefSchema.js';
import asyncForEach from '../../lib/asyncForEach.js';
import log from '../../lib/log.js';
;
const portalSchema = new mongoose.Schema({
    direction: { type: String, required: true, enum: ['up', 'down', 'east', 'west', 'north', 'south', 'northeast', 'northwest', 'southeast', 'southwest'], },
    destinationId: { type: mongoose.Schema.Types.ObjectId, required: true },
    doorId: { type: mongoose.Schema.Types.ObjectId },
}, {
    timestamps: true,
});
;
;
;
;
const roomSchema = new mongoose.Schema({
    name: { type: String, required: true },
    areaId: { type: mongoose.Schema.Types.ObjectId },
    description: { type: String, default: '' },
    characterIds: [{ type: mongoose.Schema.Types.ObjectId }],
    inanimates: [{ type: inanimateRefSchema }],
    spawnerIds: [{ type: mongoose.Schema.Types.ObjectId }],
    exits: [{ type: portalSchema }],
    loadInfo: { type: loaderSchema, default: (val) => ({ loadId: '', version: 0 }) },
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
roomSchema.static('findByLoadId', function (loadId) {
    return __awaiter(this, void 0, void 0, function* () {
        return RoomModel.findOne({ 'loadInfo.loadId': loadId });
    });
});
/**
 * Update this object from the externally loaded object
 *
 * Note that this does not save the RoomModel.
 *
 * @param {Object} loadedObject - The externally provided object
 */
roomSchema.method('updateFromLoad', function (loadedObject) {
    return __awaiter(this, void 0, void 0, function* () {
        if (this.loadInfo.version >= loadedObject.version) {
            return;
        }
        if (this.loadInfo.loadId !== loadedObject.loadId) {
            return;
        }
        this.name = loadedObject.name;
        this.description = loadedObject.description;
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
 * @param {Object} loadedObject - The externally provided object
 */
roomSchema.method('updateFromLoadRefs', function (loadedObject) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        if (this.loadInfo.version >= loadedObject.version) {
            return;
        }
        if (this.loadInfo.loadId !== loadedObject.loadId) {
            return;
        }
        if (loadedObject.areaLoadId) {
            const area = yield AreaModel.findByLoadId(loadedObject.areaLoadId);
            if (!area) {
                log.error({ roomId: this._id, areaLoadId: loadedObject.areaLoadId }, 'Unable to find area');
                throw new Error(`Unable to find area: ${loadedObject.areaLoadId}`);
            }
            this.areaId = area._id;
        }
        const exits = [];
        yield asyncForEach(loadedObject.exits, (exit) => __awaiter(this, void 0, void 0, function* () {
            const destinationRoom = yield RoomModel.findByLoadId(exit.loadId);
            if (!destinationRoom) {
                log.error({ roomId: this._id, roomLoadId: exit.loadId }, 'Unable to find room');
                return;
            }
            const exitInfo = {
                direction: exit.direction,
                destinationId: destinationRoom._id,
            };
            if (exit.doorLoadId) {
                const door = yield DoorModel.findByLoadId(exit.doorLoadId);
                if (!door) {
                    log.error({ roomId: this._id, doorLoadId: exit.doorLoadId }, 'Unable to find door');
                    return;
                }
                exitInfo.doorId = door._id;
            }
            exits.push(exitInfo);
        }));
        if (exits.length !== ((_a = loadedObject.exits) === null || _a === void 0 ? void 0 : _a.length)) {
            throw new Error(`Unable to load all exits for room ${this._id}`);
        }
        this.exits = [...exits];
        if (loadedObject.spawnerLoadIds) {
            const spawnerIds = [];
            yield asyncForEach(loadedObject.spawnerLoadIds, (spawnerLoadId) => __awaiter(this, void 0, void 0, function* () {
                const spawner = yield SpawnerModel.findByLoadId(spawnerLoadId);
                if (!spawner) {
                    log.error({ roomId: this._id, spawnerLoadId }, 'Unable to find spawner');
                    return;
                }
                spawnerIds.push(spawner._id);
            }));
            if (spawnerIds.length !== loadedObject.spawnerLoadIds.length) {
                throw new Error(`Unable to load all spawners from room ${this._id}`);
            }
            this.spawnerIds = [...spawnerIds];
        }
    });
});
const RoomModel = mongoose.model('Room', roomSchema);
export default RoomModel;
