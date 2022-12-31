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
const AreaModel_js_1 = __importDefault(require("./models/AreaModel.js"));
const ConversationModel_js_1 = __importDefault(require("./models/ConversationModel.js"));
const DoorModel_js_1 = __importDefault(require("./models/DoorModel.js"));
const RoomModel_js_1 = __importDefault(require("./models/RoomModel.js"));
const FactionModel_js_1 = __importDefault(require("./models/FactionModel.js"));
const QuestModel_js_1 = __importDefault(require("./models/QuestModel.js"));
const SpawnerModel_js_1 = __importDefault(require("./models/SpawnerModel.js"));
const asyncForEach_js_1 = __importDefault(require("../lib/asyncForEach.js"));
const log_js_1 = __importDefault(require("../lib/log.js"));
async function gather(definitions, model) {
    const dbTuples = [];
    if (!definitions) {
        return dbTuples;
    }
    await (0, asyncForEach_js_1.default)(definitions, async (definition) => {
        let dbModel = await model.findByLoadId(definition.loadId);
        if (!dbModel) {
            dbModel = new model();
            dbModel.loadInfo.version = definition.version ? definition.version - 1 : 0;
            dbModel.loadInfo.loadId = definition.loadId;
        }
        dbTuples.push({ dbModel, definition, model });
    });
    return dbTuples;
}
/**
 * Load objects into the database
 *
 * Expected schema:
 * {
 *   areas: [{
 *     loadId -> String
 *     version -> int
 *     name -> String
 *     roomLoadIds -> List[ String ]
 *   }],
 *   rooms: [{
 *     loadId -> String
 *     version -> int
 *     name -> String
 *     description -> String
 *     areaLoadId: -> String
 *     spawnerLoadIds -> [ String ]
 *     exits -> [{
 *        direction -> String,
 *        loadId -> String,
 *        doorLoadId -> String
 *     }]
 *   ],
 *   spawners: [{
 *    loadId -> String,
 *    version -> int
 *     characterFactories -> List[ String ]
 *     [characterSelection] -> Enum[String]
 *     [triggerType] -> Enum[String]
 *     [triggerUpperLimit] -> int
 *     [spawnsPerTrigger] -> int
 *   }],
 *   doors: [{
 *     loadId -> String,
 *     version -> int,
 *     name -> String,
 *     description -> String,
 *     hasLock -> Boolean,
 *     skillDC -> int,
 *     inanimateId -> String,
 *     weight -> int,
 *     durability -> int
 *   }],
 *   factions: [{
 *     name -> String,
 *     positiveModifier -> int,
 *     negativeModifier -> int,
 *     opposingFactions -> List[ String ],
 *     supportingFactions -> List[ String ]
 *   }]
 * }
 *
 * NOTE: If you add a new type here, e.g., doors, don't forget to add it the JSON
 * flattening in the bootstrap!!!!
 *
 * @param {Object} loadObject - The objects to load
 *
 * @returns {Boolean} true if all updates succeeded, false otherwise
 */
async function loadObjects(loadObject) {
    let dbTuples = [];
    let result = true;
    // Drop any new object types to load here
    log_js_1.default.debug('Gathering database models');
    dbTuples = dbTuples.concat(await gather(loadObject.areas, AreaModel_js_1.default));
    dbTuples = dbTuples.concat(await gather(loadObject.conversations, ConversationModel_js_1.default));
    dbTuples = dbTuples.concat(await gather(loadObject.doors, DoorModel_js_1.default));
    dbTuples = dbTuples.concat(await gather(loadObject.quests, QuestModel_js_1.default));
    dbTuples = dbTuples.concat(await gather(loadObject.rooms, RoomModel_js_1.default));
    dbTuples = dbTuples.concat(await gather(loadObject.spawners, SpawnerModel_js_1.default));
    dbTuples = dbTuples.concat(await gather(loadObject.factions, FactionModel_js_1.default));
    try {
        log_js_1.default.debug('Loading definitions into database models');
        await (0, asyncForEach_js_1.default)(dbTuples, async (tuple) => {
            const { dbModel, definition } = tuple;
            await dbModel.updateFromLoad(definition);
        });
        log_js_1.default.debug('Saving basic properties');
        await (0, asyncForEach_js_1.default)(dbTuples, async (tuple) => {
            const { dbModel } = tuple;
            await dbModel.save();
        });
        log_js_1.default.debug('Updating references on database models');
        await (0, asyncForEach_js_1.default)(dbTuples, async (tuple) => {
            const { dbModel, definition } = tuple;
            await dbModel.updateFromLoadRefs(definition);
        });
        log_js_1.default.debug('Updating versions and saving');
        await (0, asyncForEach_js_1.default)(dbTuples, async (tuple) => {
            const { dbModel, definition } = tuple;
            dbModel.loadInfo.version = definition.version;
            await dbModel.save();
        });
    }
    catch (err) {
        log_js_1.default.error({ err });
        result = false;
    }
    return result;
}
exports.default = loadObjects;
