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
import {
  longswordFactory,
  maceFactory,
  shortswordFactory,
} from '../src/game/objects/Weapon.js';

const argv = yargs(hideBin(process.argv))
  .option('roomId', {
    alias: 'r',
    description: 'Specify the ID of the room to put the item in',
  })
  .option('item', {
    alias: 'i',
    description: 'The item to create.'
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

initDB().then(async () => {
  log.info({ roomId: argv.roomId, item: argv.item }, 'Creating item');

  const room = await RoomModel.findById(argv.roomId);
  if (!room) {
    log.error({ roomId: argv.roomId }, 'Room does not exist');
    return;
  }

  let item;
  let itemType;
  switch(argv.item) {
  case 'longsword':
    item = await longswordFactory();
    itemType = 'weapon';
    break;
  case 'shortsword':
    item = await shortswordFactory();
    itemType = 'weapon';
    break;
  case 'mace':
    item = await maceFactory();
    itemType = 'weapon';
    break;
  default:
    log.error({ item: argv.item }, 'Unknown item');
  }
  room.inanimates = [];
  room.inanimates.push({ inanimateId: item.model._id, inanimateType: itemType });
  await room.save();

}).then(async () => {
  await shutdownDB();
});