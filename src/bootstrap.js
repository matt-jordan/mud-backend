import express from 'express';

// TODO: Stuff to move
import bunyanMiddlware from 'bunyan-middleware';
import log from './lib/log.js';

import { Server as socketIoServer } from 'socket.io';
import http from 'http';
import httpShutdown from 'http-shutdown';

import SocketIoServer from './lib/transports/SocketIoServer.js';
import MessageBus from './lib/messagebus/MessageBus.js';
import { initDB, shutdownDB } from './db/mongo.js';

// TODO: Move to the API initialization
import controllers from './api/controllers/index.js';
import middleware from './api/middleware/index.js';

let socket;

async function boot() {

  await initDB();

  const app = express();
  app.use((req, res, next) => {
    res.set('x-powered-by', 'hope');
    next();
  });
  app.set('trust proxy', true);

  app.use(express.static('dist'));

  // TODO: Likely, move this into the API as a separate setup routine
  app.use(express.json());
  app.use(bunyanMiddlware({
    headerName: 'x-request-id',
    propertyName: 'reqId',
    logName: 'reqId',
    level: 'debug',
    logger: log,
  }));
  app.use('/accounts', controllers.accounts);

  const httpServer = httpShutdown(http.createServer(app));
  socket = new SocketIoServer(httpServer, new socketIoServer());

  return httpServer;
}

async function shutdown() {
  const mb = MessageBus.getInstance();
  mb.shutdown();

  await socket.disconnectAll();

  await shutdownDB();
}

export { boot, shutdown };