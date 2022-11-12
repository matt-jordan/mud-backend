//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import { MongoMemoryServer } from 'mongodb-memory-server';
import { boot, shutdown } from '../build/bootstrap.js';

let mongodb;
let server;

before(async function() {
  setTimeout(() => {
    console.log('Test execution timed out after 10 seconds');
  }, 10000);

  mongodb = await MongoMemoryServer.create({ instance: { port: 5000 }});

  server = await boot();
  server.listen(0, () => {
    global.server = server;
  });

  return server;
});

after(async function () {
  if (mongodb) {
    await mongodb.stop();
  }

  if (server) {
    await shutdown();
    await server.shutdown();
  }
});
