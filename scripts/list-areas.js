//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import { initDB, shutdownDB } from '../src/db/mongo.js';
import log from '../src/lib/log.js';
import AreaModel from '../src/db/models/Area.js';

initDB().then(async () => {
  const areas = await AreaModel.find();
  for (const [index, area] of areas.entries()) {
    log.info({ areaName: area.name, id: area._id.toString() }, `Area #${index}`);
  }

  await shutdownDB();
});