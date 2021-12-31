import config from 'config';
import express from 'express';

// TODO: Stuff to move
import cors from 'cors';
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


  // TODO: CORS - should move to a middleware...
  const allowedOrigins = (config.api && config.api.allowedOrigins) || [];
  app.use(cors({
    credentials: true,
    origin: function(origin, callback) {
      // CURL - we may need to think about this in the long run.
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = 'The CORS policy for this site does not allow access ' +
                    'from the specified Origin';
        return callback(new Error(msg), false);
      }

      return callback(null, true);
    }
  }));

  // TODO: Likely, move this into the API as a separate setup routine
  app.use(express.json());
  app.use(bunyanMiddlware({
    headerName: 'x-request-id',
    propertyName: 'reqId',
    logName: 'reqId',
    level: 'debug',
    logger: log,
  }));
  app.use(middleware.authHandler);
  app.use('/accounts', controllers.accounts);
  app.use('/login', controllers.login);
  // This must be last
  app.use(middleware.defaultErrorHandler);

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