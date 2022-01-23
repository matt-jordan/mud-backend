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
import AreaModel from '../src/db/models/Area.js';

const argv = yargs(hideBin(process.argv))
  .option('name', {
    alias: 'n',
    description: 'Specify the name of the area',
  })
  .parse();

if (!argv.name) {
  log.error('Must supply --name option');
  process.exit(-1);
}

initDB().then(async () => {
  log.info({ name: argv.name }, 'Creating area');

  const area = new AreaModel();
  area.name = argv.name;
  await area.save();

  log.info({ area }, 'Created');

  await shutdownDB();
});