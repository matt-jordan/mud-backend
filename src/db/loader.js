//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import AreaModel from './models/AreaModel.js';
import ConversationModel from './models/ConversationModel.js';
import DoorModel from './models/DoorModel.js';
import RoomModel from './models/RoomModel.js';
import FactionModel from './models/FactionModel.js';
import QuestModel from './models/QuestModel.js';
import SpawnerModel from './models/SpawnerModel.js';
import asyncForEach from '../lib/asyncForEach.js';
import log from '../lib/log.js';


async function gather(definitions, model) {
  const dbTuples = [];

  if (!definitions) {
    return dbTuples;
  }
  await asyncForEach(definitions, async (definition) => {
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
  log.debug('Gathering database models');
  dbTuples = dbTuples.concat(await gather(loadObject.areas, AreaModel));
  dbTuples = dbTuples.concat(await gather(loadObject.conversations, ConversationModel));
  dbTuples = dbTuples.concat(await gather(loadObject.doors, DoorModel));
  dbTuples = dbTuples.concat(await gather(loadObject.quests, QuestModel));
  dbTuples = dbTuples.concat(await gather(loadObject.rooms, RoomModel));
  dbTuples = dbTuples.concat(await gather(loadObject.spawners, SpawnerModel));
  dbTuples = dbTuples.concat(await gather(loadObject.factions, FactionModel));

  try {
    log.debug('Loading definitions into database models');
    await asyncForEach(dbTuples, async (tuple) => {
      const { dbModel, definition } = tuple;

      await dbModel.updateFromLoad(definition);
    });

    log.debug('Saving basic properties');
    await asyncForEach(dbTuples, async (tuple) => {
      const { dbModel } = tuple;

      await dbModel.save();
    });

    log.debug('Updating references on database models');
    await asyncForEach(dbTuples, async (tuple) => {
      const { dbModel, definition } = tuple;

      await dbModel.updateFromLoadRefs(definition);
    });

    log.debug('Updating versions and saving');
    await asyncForEach(dbTuples, async (tuple) => {
      const { dbModel, definition } = tuple;

      dbModel.loadInfo.version = definition.version;
      await dbModel.save();
    });
  } catch (err) {
    log.error({ err });
    result = false;
  }

  return result;
}

export default loadObjects;
