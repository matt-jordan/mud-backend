//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

process.title = 'mud-backend';

import config from 'config';

import { boot, shutdown } from './src/bootstrap.js';
import log from './src/lib/log.js';

boot()
  .then(server => new Promise((resolve, reject) => {

    server.setTimeout(0);
    server.on('connection', socket => socket.setKeepAlive(true, config.keepAliveInterval));
    server.on('error', reject);

    server.listen(config.port, () => {
      log.info({ address: server.address(), port: config.port }, 'HTTP server listening');
      resolve();
    });

    process.on('uncaughtException', (err) => {
      console.log(err);
    });

    ['SIGUSR2', 'SIGINT', 'SIGTERM'].forEach(signal =>
      process.once(signal, () => {
        log.info({ signal }, 'Shutting down');

        shutdown().then(() => {
          server.shutdown(() => {
            log.info({ signal }, 'Server shut down');
            process.kill(process.pid, signal);
          });
        });
      }));
  }));
