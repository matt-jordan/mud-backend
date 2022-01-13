import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import mongoose from 'mongoose';

import { initDB, shutdownDB } from '../src/db/mongo.js';
import log from '../src/lib/log.js';
import AreaModel from '../src/db/models/Area.js';
import RoomModel from '../src/db/models/Room.js';

const ObjectId = mongoose.Schema.ObjectId;

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
    description: 'Comma delineated pair of roomId and direction that leads into this room'
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

  if (argv.entrance) {
    const [entranceRoomId, direction] = argv.entrance.split(',');

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
  }

  await room.save();

  area.roomIds.push(room._id);
  await area.save();

  log.info({ room }, 'Created');

  await shutdownDB();
});