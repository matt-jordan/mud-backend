//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import express from 'express';
import http from 'http';
import httpShutdown from 'http-shutdown';
import path from 'path';
import fs from 'fs';

import MessageBus from './lib/messagebus/MessageBus.js';
import log from './lib/log.js';
import asyncForEach from './lib/asyncForEach.js';

import { initDB, shutdownDB } from './db/mongo.js';
import loadObjects from './db/loader.js';

import initControllers from './api/controllers/index.js';
import { initMiddleware, finalizeMiddleware } from './api/middleware/index.js';
import {
  initWebsocketServer,
  getWebsocketServer,
  shutdownWebsocketServer,
} from './api/websocket/index.js';

import World from './game/world/World.js';

// TODO: Think about this part...
let world;

async function loadWorld() {
  const fsPromises = fs.promises;

  const worldPath = path.resolve('./world', process.env.NODE_ENV);
  log.debug({ worldPath }, 'Loading world definition');

  // This is a bit of a hack, but in order for all the areas/rooms to reference
  // each other, we need to flatten them into a single object to load. Eventually
  // this may become unwieldy as we add other object types to load and/or if it
  // gets too large, but for now we'll live with this mild hack.
  const rawLoadedData = [];
  const normalizedData = {
    areas: [],
    doors: [],
    rooms: [],
    spawners: [],
    factions: [],
    conversations: [],
  };

  try {
    const files = await fsPromises.readdir(worldPath);
    await asyncForEach(files, async (file) => {
      const filePath = path.resolve('./world', process.env.NODE_ENV, file);
      log.debug({ filePath }, 'Loading world file');

      rawLoadedData.push(JSON.parse(await fsPromises.readFile(filePath)));
    });
    rawLoadedData.forEach(loadedData => {
      ['areas', 'rooms', 'doors', 'spawners', 'factions', 'conversations'].forEach((category) => {
        normalizedData[category].push(...(loadedData[category] ? loadedData[category] : []));
      });
    });
    await loadObjects(normalizedData);
  } catch (err) {
    log.warn({ err, worldPath }, 'Error loading world; skipping');
  }
}

async function boot() {

  await initDB();
  await loadWorld();

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

  world = World.getInstance(getWebsocketServer());
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