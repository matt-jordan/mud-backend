//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import { boot, shutdown } from '../src/bootstrap.js';

let server;

before(async function() {

  setTimeout(() => {
    console.log('Test execution timed out after 10 seconds');
  }, 10000);

  server = await boot();
  server.listen(0, () => {
    global.server = server;
  });

  return server;
});

after(async function () {
  if (server) {
    await shutdown();
    await server.shutdown();
  }
});
