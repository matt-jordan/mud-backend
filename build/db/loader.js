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
import AreaModel from './models/AreaModel.js';
import ConversationModel from './models/ConversationModel.js';
import DoorModel from './models/DoorModel.js';
import RoomModel from './models/RoomModel.js';
import FactionModel from './models/FactionModel.js';
import QuestModel from './models/QuestModel.js';
import SpawnerModel from './models/SpawnerModel.js';
import asyncForEach from '../lib/asyncForEach.js';
import log from '../lib/log.js';
function gather(definitions, model) {
    return __awaiter(this, void 0, void 0, function* () {
        const dbTuples = [];
        if (!definitions) {
            return dbTuples;
        }
        yield asyncForEach(definitions, (definition) => __awaiter(this, void 0, void 0, function* () {
            let dbModel = yield model.findByLoadId(definition.loadId);
            if (!dbModel) {
                dbModel = new model();
                dbModel.loadInfo.version = definition.version ? definition.version - 1 : 0;
                dbModel.loadInfo.loadId = definition.loadId;
            }
            dbTuples.push({ dbModel, definition, model });
        }));
        return dbTuples;
    });
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
function loadObjects(loadObject) {
    return __awaiter(this, void 0, void 0, function* () {
        let dbTuples = [];
        let result = true;
        // Drop any new object types to load here
        log.debug('Gathering database models');
        dbTuples = dbTuples.concat(yield gather(loadObject.areas, AreaModel));
        dbTuples = dbTuples.concat(yield gather(loadObject.conversations, ConversationModel));
        dbTuples = dbTuples.concat(yield gather(loadObject.doors, DoorModel));
        dbTuples = dbTuples.concat(yield gather(loadObject.quests, QuestModel));
        dbTuples = dbTuples.concat(yield gather(loadObject.rooms, RoomModel));
        dbTuples = dbTuples.concat(yield gather(loadObject.spawners, SpawnerModel));
        dbTuples = dbTuples.concat(yield gather(loadObject.factions, FactionModel));
        try {
            log.debug('Loading definitions into database models');
            yield asyncForEach(dbTuples, (tuple) => __awaiter(this, void 0, void 0, function* () {
                const { dbModel, definition } = tuple;
                yield dbModel.updateFromLoad(definition);
            }));
            log.debug('Saving basic properties');
            yield asyncForEach(dbTuples, (tuple) => __awaiter(this, void 0, void 0, function* () {
                const { dbModel } = tuple;
                yield dbModel.save();
            }));
            log.debug('Updating references on database models');
            yield asyncForEach(dbTuples, (tuple) => __awaiter(this, void 0, void 0, function* () {
                const { dbModel, definition } = tuple;
                yield dbModel.updateFromLoadRefs(definition);
            }));
            log.debug('Updating versions and saving');
            yield asyncForEach(dbTuples, (tuple) => __awaiter(this, void 0, void 0, function* () {
                const { dbModel, definition } = tuple;
                dbModel.loadInfo.version = definition.version;
                yield dbModel.save();
            }));
        }
        catch (err) {
            log.error({ err });
            result = false;
        }
        return result;
    });
}
export default loadObjects;
