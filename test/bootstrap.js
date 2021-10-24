import http from 'http';
import httpShutdown from 'http-shutdown';
import mongoose from 'mongoose';

import boot from '../src/bootstrap.js';

function startServer(app) {
  return new Promise(resolve => {
    server = httpShutdown(http.createServer(app));
    server.listen(0, () => resolve(server));
  });
}

let server;

before(async function() {

  setTimeout(() => {
    log();
  }, 10000);

  const app = await boot();
  server = await startServer(app);
});

after(async function () {
  await mongoose.disconnect();
  if (server) {
    await server.shutdown();
  }
});
