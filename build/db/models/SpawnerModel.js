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
;
;
;
;
const spawnerSchema = new mongoose_1.default.Schema({
    characterFactories: [{ type: String }],
    characterSelection: { type: String, default: 'random', enum: ['random'] },
    triggerType: { type: String, default: 'tick', enum: ['tick'] },
    triggerUpperLimit: { type: Number, default: 20 },
    spawnsPerTrigger: { type: Number, default: 1 },
    state: { type: mongoose_1.default.Schema.Types.Mixed },
    factoryData: { type: mongoose_1.default.Schema.Types.Mixed },
    loadInfo: { type: loaderSchema_js_1.default, default: (val) => ({ loadId: '', version: 0 }) },
}, {
    timestamps: true,
});
/**
 * Find a Spawner by its external provided loadId
 *
 * @param {String} loadId - The unique ID of the spawner
 *
 * @returns {SpawnerModel}
 */
spawnerSchema.static('findByLoadId', function findByLoadId(loadId) {
    return SpawnerModel.findOne({ 'loadInfo.loadId': loadId });
});
/**
 * Update this object from the externally loaded object
 *
 * Note that this does not save the SpawnerModel.
 *
 * @param {Object} loadedObject - The externally provided object
 */
spawnerSchema.method('updateFromLoad', async function (loadedObject) {
    if (this.loadInfo.version >= loadedObject.version) {
        return;
    }
    if (this.loadInfo.loadId !== loadedObject.loadId) {
        return;
    }
    if (loadedObject.characterFactories) {
        this.characterFactories = [...loadedObject.characterFactories];
    }
    if (loadedObject.characterSelection) {
        this.characterSelection = loadedObject.characterSelection;
    }
    if (loadedObject.triggerType) {
        this.triggerType = loadedObject.triggerType;
    }
    if (loadedObject.triggerUpperLimit) {
        this.triggerUpperLimit = loadedObject.triggerUpperLimit;
    }
    if (loadedObject.spawnsPerTrigger) {
        this.spawnsPerTrigger = loadedObject.spawnsPerTrigger;
    }
    if (loadedObject.factoryData) {
        this.factoryData = loadedObject.factoryData;
    }
});
/**
 * Post-process any IDs that were referenced by the externally loaded object
 *
 * In order to prevent ordering issues, loading an external object first loads
 * all the properties that have to exist (see updateFromLoad). It then updates
 * properties in this method that reference other objects.
 *
 * Note that this does not save the SpawnerModel.
 *
 * @param {Object} loadedObject - The externally provided object
 */
spawnerSchema.method('updateFromLoadRefs', async function (loadedObject) {
    if (this.loadInfo.version >= loadedObject.version) {
        return;
    }
    if (this.loadInfo.loadId !== loadedObject.loadId) {
        return;
    }
    return;
});
const SpawnerModel = mongoose_1.default.model('Spawner', spawnerSchema);
exports.default = SpawnerModel;
