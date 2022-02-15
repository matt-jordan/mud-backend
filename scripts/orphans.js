//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { initDB, shutdownDB } from '../src/db/mongo.js';
import asyncForEach from '../src/lib/asyncForEach.js';
import log from '../src/lib/log.js';
import AreaModel from '../src/db/models/AreaModel.js';
import RoomModel from '../src/db/models/RoomModel.js';
import SpawnerModel from '../src/db/models/SpawnerModel.js';
import CharacterModel from '../src/db/models/CharacterModel.js';
import WeaponModel from '../src/db/models/WeaponModel.js';
import ArmorModel from '../src/db/models/AreaModel.js';
import InanimateModel from '../src/db/models/InanimateModel.js';

const discoveredRooms = [];
const discoveredCharacters = [];
const discoveredWeapons = [];
const discoveredArmor = [];
const discoveredInanimates = [];
const discoveredSpawners = [];

const loadInanimate = async (containingType, containingId, inanimateRef) => {
  switch (inanimateRef.inanimateType) {
  case 'weapon': {
    const weapon = await WeaponModel.findById(inanimateRef.inanimateId);
    if (!weapon) {
      log.warn({ containingType, containingId, inanimateRef }, 'Failed to find Weapon');
    } else {
      discoveredWeapons.push(weapon);
    }
    return weapon;
  }
  case 'armor': {
    const armor = await ArmorModel.findById(inanimateRef.inanimateId);
    if (!armor) {
      log.warn({ containingType, containingId, inanimateRef }, 'Failed to find Armor');
    } else {
      discoveredArmor.push(armor);
    }
    return armor;
  }
  case 'inanimate': {
    const inanimate = await InanimateModel.findById(inanimateRef.inanimateId);
    if (!inanimate) {
      log.warn({ containingType, containingId, inanimateRef }, 'Failed to find Inanimate');
    } else {
      discoveredInanimates.push(inanimate);
    }
    return inanimate;
  }
  }
  return null;
};

const inanimateOrphanDetection = async (inanimate) => {
  if (!inanimate.isContainer) {
    return;
  }
  await asyncForEach(inanimate.inanimates, async (innerInanimateRef) => {
    const innerInanimate = await loadInanimate(innerInanimateRef);
    if (innerInanimate) {
      await inanimateOrphanDetection(innerInanimate);
    }
  });
};

const characterOrphanDetection = async (character) => {
  if (character.inanimates) {
    await asyncForEach(character.inanimates, async (inanimateRef) => {
      const inanimate = await loadInanimate('character', character._id, inanimateRef);
      if (inanimate) {
        await inanimateOrphanDetection(inanimate);
      }
    });
  }

  await asyncForEach(Object.keys(character.physicalLocations), async (location) => {
    if (character.physicalLocations[location] && character.physicalLocations[location].item) {
      const inanimate = await loadInanimate('character', character._id, character.physicalLocations[location].item);
      if (inanimate) {
        await inanimateOrphanDetection(inanimate);
      }
    }
  });
};

const spawnerOrphanDetection = async (spawner) => {
  // State is undefined, so just ignore it for now
};

const roomOrphanDetection = async (room) => {
  await asyncForEach(room.characterIds, async (characterId) => {
    const character = await CharacterModel.findById(characterId);
    if (!character) {
      log.warn({ roomId: room._id, characterId }, 'Discovered orphaned ref to character in room');
    } else {
      discoveredCharacters.push(character);
      await characterOrphanDetection(character);
    }

    if (room.inanimates) {
      await asyncForEach(room.inanimates, async (inanimateRef) => {
        const inanimate = await loadInanimate('room', room._id, inanimateRef);
        if (inanimate) {
          await inanimateOrphanDetection(inanimate);
        }
      });
    }

    if (room.spawnerIds) {
      await asyncForEach(room.spawnerIds, async (spawnerId) => {
        const spawner = await SpawnerModel.findById(spawnerId);
        if (!spawner) {
          log.warn({ roomId: room._id, spawnerId }, 'Discovered orphaned ref to spawner in room');
        } else {
          discoveredSpawners.push(spawner);
          await spawnerOrphanDetection(spawner);
        }
      });
    }

  });
};

const argv = yargs(hideBin(process.argv))
  .option('nodryrun', {
    alias: 'n',
    description: 'Eliminate the dry run',
  })
  .parse();

initDB().then(async () => {
  const areas = await AreaModel.find();
  log.info(`Areas: ${areas.length}`);

  const rooms = await RoomModel.find();
  log.info(`Rooms: ${rooms.length}`);

  const characters = await CharacterModel.find();
  log.info(`Characters: ${characters.length}`);

  const weapons = await WeaponModel.find();
  log.info(`Weapons: ${weapons.length}`);

  const armor = await ArmorModel.find();
  log.info(`Armor: ${armor.length}`);

  const inanimates = await InanimateModel.find();
  log.info(`Inanimates: ${inanimates.length}`);

  const spawners = await SpawnerModel.find();
  log.info(`Spawners: ${spawners.length}`);

  await asyncForEach(areas, async (area) => {
    await asyncForEach(area.roomIds, async (roomId) => {
      const room = await RoomModel.findById(roomId);
      if (!room) {
        log.warn({ roomId, areaId: area._id }, 'Discovered orphaned room referenced by area');
      }
      discoveredRooms.push(room);

      await roomOrphanDetection(room);
    });
  });

  // Match our discoverd items back to the raw dumps from the collections
  await asyncForEach(rooms, async (room) => {
    const match = discoveredRooms.find(r => r._id.equals(room._id));
    if (!match) {
      log.warn({ roomId: room._id }, 'Room not referenced by an area');
    }
    await roomOrphanDetection(room);
  });

  await asyncForEach(characters, async (character) => {
    const match = discoveredCharacters.find(c => c._id.equals(character._id));
    if (!match) {
      log.warn({ characterId: character._id }, 'Character not referenced by a room');
      if (argv.nodryrun) {
        await CharacterModel.deleteOne({ _id: character._id});
        log.info({ characterId: character._id }, 'Deleted character');
      }
    }
    await characterOrphanDetection(character);
  });

  await asyncForEach(armor, async (armor) => {
    const match = discoveredArmor.find(a => a._id.equals(armor._id));
    if (!match) {
      log.warn({ armorId: armor._id }, 'Armor not referenced');
      if (argv.nodryrun) {
        await ArmorModel.deleteOne({ _id: armor._id});
        log.info({ armorId: armor._id }, 'Deleted armor');
      }
    }
  });

  await asyncForEach(weapons, async (weapon) => {
    const match = discoveredWeapons.find(w => w._id.equals(weapon._id));
    if (!match) {
      log.warn({ weaponId: weapon._id }, 'Weapon not referenced');
      if (argv.nodryrun) {
        await WeaponModel.deleteOne({ _id: weapon._id});
        log.info({ weaponId: weapon._id }, 'Deleted weapon');
      }
    }
  });

  await asyncForEach(inanimates, async (inanimate) => {
    const match = discoveredInanimates.find(i => i._id.equals(inanimate._id));
    if (!match) {
      log.warn({ inanimateId: inanimate._id }, 'Inanimate not referenced');
      if (argv.nodryrun) {
        await InanimateModel.deleteOne({ _id: inanimate._id});
        log.info({ inanimateId: inanimate._id }, 'Deleted inanimate');
      }
    }
  });

  await asyncForEach(spawners, async (spawner) => {
    const match = discoveredSpawners.find(i => i._id.equals(spawner._id));
    if (!match) {
      log.warn({ spawnerId: spawner._id }, 'Spawner not referenced');
    }
    await spawnerOrphanDetection(spawner);
  });

  await shutdownDB();
});