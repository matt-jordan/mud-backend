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

function getOpposingDirection(direction) {
  switch(direction.toLowerCase()) {
  case 'north':
    return 'south';
  case 'south':
    return 'north';
  case 'east':
    return 'west';
  case 'west':
    return 'east';
  case 'up':
    return 'down';
  case 'down':
    return 'up';
  case 'northwest':
    return 'southeast';
  case 'southeast':
    return 'northwest';
  case 'northeast':
    return 'southwest';
  case 'southwest':
    return 'northeast';
  default:
    return 'unknown';
  }
}

const argv = yargs(hideBin(process.argv))
  .option('areaId', {
    alias: 'a',
    description: '[REQUIRED] The ID of the area to put the room in'
  })
  .option('name', {
    alias: 'n',
    description: '[REQUIRED] Specify the name of the room',
  })
  .option('description', {
    alias: 'd',
    description: 'Text description of the room',
  })
  .option('entrance', {
    alias: 'e',
    array: true,
    description: 'Comma delineated pair of roomId and direction that leads into this room'
  })
  .option('spawner', {
    alias: 's',
    description: 'Add a spawner. Note that this is always a pre-configured rat spawner. Deal.',
  })
  .parse();

if (!argv.areaId || !argv.name) {
  log.error('Missing required parameters');
  process.exit(-1);
}

initDB().then(async () => {
  log.info({ areaId: argv.areaId }, 'Retrieving area');
  const area = await AreaModel.findById(argv.areaId);
  if (!area) {
    log.error({ areaId: argv.areaId }, 'Area not found');
    process.exit(-1);
  }

  log.info({ name: argv.name }, 'Creating room');
  const room = new RoomModel();
  room.areaId = area._id;
  room.name = argv.name;
  room.description = argv.description;

  await asyncForEach(argv.entrance, async (entrance) => {
    const [entranceRoomId, direction] = entrance.split(',');

    log.info({ entranceRoomId, direction }, 'Creating entrance from this room');
    const entranceRoom = await RoomModel.findById(entranceRoomId);
    entranceRoom.exits.push({
      direction,
      destinationId: room._id,
    });
    await entranceRoom.save();

    log.info({ roomId: room._id, direction: getOpposingDirection(direction)}, 'Creating exit from this room');
    room.exits.push({
      direction: getOpposingDirection(direction),
      destinationId: entranceRoom._id,
    });
  });

  if (argv.spawner) {
    log.info({ name: argv.name }, 'Creating spawner');

    const spawner = new SpawnerModel();
    spawner.characterFactories.push('RatFactory');
    spawner.characterSelection = 'random';
    spawner.triggerType = 'tick';
    spawner.triggerUpperLimit = 60;
    spawner.spawnsPerTrigger = 1;
    spawner.save();

    room.spawnerIds.push(spawner._id);
  }

  await room.save();

  area.roomIds.push(room._id);
  await area.save();

  log.info({ room }, 'Created');

  await shutdownDB();
});