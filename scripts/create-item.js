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
import log from '../src/lib/log.js';
import RoomModel from '../src/db/models/RoomModel.js';
import objectFactories from '../src/game/objects/factories/index.js';

const argv = yargs(hideBin(process.argv))
  .option('roomId', {
    alias: 'r',
    description: 'Specify the ID of the room to put the item in',
  })
  .option('item', {
    alias: 'i',
    description: 'The item to create.'
  })
  .option('data', {
    alias: 'd',
    description: 'Stringified JSON to pass to the item creation factory',
  })
  .parse();

if (!argv.roomId) {
  log.error('Must supply --roomId option');
  process.exit(-1);
}

if (!argv.item) {
  log.error('Must supply --item option');
  process.exit(-1);
}

let data = {};
if (argv.data) {
  data = JSON.parse(argv.data);
}

initDB().then(async () => {
  log.info({ roomId: argv.roomId, item: argv.item }, 'Creating item');

  const room = await RoomModel.findById(argv.roomId);
  if (!room) {
    log.error({ roomId: argv.roomId }, 'Room does not exist');
    return;
  }

  const item = await objectFactories(argv.item)(data);
  room.inanimates.push({ inanimateId: item.model._id, inanimateType: item.itemType });
  await room.save();

  log.info({ itemId: item.id, roomId: room.id }, `${item.name} placed in room ${room.name}`);

}).then(async () => {
  await shutdownDB();
});