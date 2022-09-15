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
import longswordFactory from '../src/game/objects/factories/longsword.js';
import maceFactory from '../src/game/objects/factories/mace.js';
import shortswordFactory from '../src/game/objects/factories/shortsword.js';
import bootsFactory from '../src/game/objects/factories/boots.js';
import capFactory from '../src/game/objects/factories/cap.js';
import glovesFactory from '../src/game/objects/factories/gloves.js';
import leggingsFactory from '../src/game/objects/factories/leggings.js';
import shirtFactory from '../src/game/objects/factories/shirt.js';

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
  case 'boots':
    item = await bootsFactory({ material: 'leather' });
    itemType = 'armor';
    break;
  case 'cap':
    item = await capFactory({ material: 'leather' });
    itemType = 'armor';
    break;
  case 'gloves':
    item = await glovesFactory({ material: 'leather' });
    itemType = 'armor';
    break;
  case 'leggings':
    item = await leggingsFactory({ material: 'cloth' });
    itemType = 'armor';
    break;
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
  case 'shirt':
    item = await shirtFactory();
    itemType = 'armor';
    break;
  default:
    log.error({ item: argv.item }, 'Unknown item');
  }

  room.inanimates.push({ inanimateId: item.model._id, inanimateType: itemType });
  await room.save();

}).then(async () => {
  await shutdownDB();
});