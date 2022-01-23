import express from 'express';
import http from 'http';
import httpShutdown from 'http-shutdown';

import MessageBus from './lib/messagebus/MessageBus.js';
import { initDB, shutdownDB } from './db/mongo.js';

import initControllers from './api/controllers/index.js';
import { initMiddleware, finalizeMiddleware } from './api/middleware/index.js';
import {
  initWebsocketServer,
  getWebsocketServer,
  shutdownWebsocketServer,
} from './api/websocket/index.js';

import World from './game/world/world.js';

// TODO: Think about this part...
let world;

async function boot() {

  await initDB();

  const app = express();

  app.use((req, res, next) => {
    res.set('x-powered-by', 'hope');
    next();
  });
  app.set('trust proxy', true);
  app.use(express.static('dist'));

  initMiddleware(app);
  initControllers(app);
  // This must be last
  finalizeMiddleware(app);

  const httpServer = httpShutdown(http.createServer(app));
  initWebsocketServer(httpServer);

  world = new World(getWebsocketServer());
  await world.load();

  return httpServer;
}

async function shutdown() {
  if (world) {
    await world.shutdown();
  }

  const mb = MessageBus.getInstance();
  mb.shutdown();

  await shutdownWebsocketServer();

  await shutdownDB();
}

export { boot, shutdown };