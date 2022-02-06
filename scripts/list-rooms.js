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

function walkRoom(path, rooms, room, x, y, coords) {
  room.exits.forEach((exit) => {
    if (!path.find(p => p.id === exit.destinationId.toString())) {
      const room = rooms.find(r => r._id.equals(exit.destinationId));
      let new_x = x, new_y = y;
      switch (exit.direction) {
      case 'north':
        new_y += 1;
        break;
      case 'south':
        new_y -= 1;
        break;
      case 'east':
        new_x += 1;
        break;
      case 'west':
        new_x -= 1;
        break;
      case 'northwest':
        new_y += 1;
        new_x -= 1;
        break;
      case 'southeast':
        new_y -= 1;
        new_x += 1;
        break;
      case 'northeast':
        new_y += 1;
        new_x += 1;
        break;
      case 'southwest':
        new_y -= 1;
        new_x -= 1;
        break;
      default:
      }
      path.push({ id: exit.destinationId.toString(), x: new_x, y: new_y });
      coords.top = Math.max(coords.top || 0, new_y);
      coords.bottom = Math.min(coords.bottom || 0, new_y);
      coords.right = Math.max(coords.right || 0, new_x);
      coords.left = Math.min(coords.left || 0, new_x);
      walkRoom(path, rooms, room, new_x, new_y, coords);
    }
  });
  return coords;
}

const argv = yargs(hideBin(process.argv))
  .option('visualize', {
    alias: 'v',
    description: 'Build an ASCII visualization of the rooms',
  })
  .option('areaId', {
    alias: 'a',
    description: '[REQUIRED] The AreaId of the rooms',
  })
  .parse();

if (!argv.areaId) {
  log.error('Must supply --areaId option');
  process.exit(-1);
}

initDB().then(async () => {
  log.info({ areaId: argv.areaId }, 'Fetching rooms by area');

  const rooms = await RoomModel.find({ areaId: argv.areaId });
  rooms.forEach(async (room) => {
    log.info({ room });
  });

  if (argv.visualize) {
    let x = 0, y = 0; // Ignore Z for now
    const path = [{ id: rooms[0]._id.toString(), x, y }];
    const result = walkRoom(path, rooms, rooms[0], x, y,
      { top: 0, bottom: 0, left: 0, right: 0 });

    const height = result.top + (result.bottom * -1) + 1;
    const width = result.right + (result.left * -1) + 1;
    const x_offset = result.left * -1;
    const y_offset = result.bottom * -1;
    const map = new Array(height).fill('.').map(() => new Array(width).fill('.'));
    for (let i = 0; i <= height; i++) {
      for (let j = 0; j <= width; j++) {
        path.forEach(p => {
          if (p.x + x_offset == j && p.y + y_offset == i) {
            map[height - i - 1][j] = '*';
          }
        });
      }
    }

    map.forEach(r => {
      console.log(r.join(''));
    });
  }

  await shutdownDB();
});