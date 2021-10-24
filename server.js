process.title = 'spire-game';

import config from 'config';
import http from 'http';
import httpShutdown from 'http-shutdown';

import boot from './src/bootstrap.js';
import log from './src/lib/log.js';

boot()
  .then(app => new Promise((resolve, reject) => {
    const server = httpShutdown(http.createServer(app));

    server.setTimeout(0);
    server.on('connection', socket => socket.setKeepAlive(true, config.keepAliveInterval));
    server.on('error', reject);

    server.listen(config.port, () => {
      log.info({ address: server.address(), port: config.port }, 'HTTP server listening');
      resolve();
    });

    ['SIGUSR2', 'SIGINT', 'SIGTERM'].forEach(signal =>
      process.once(signal, () => {
        log.info({ signal }, 'Shutting down');

        app.socketIo.disconnectAll();

        server.shutdown(() => {
          log.info({ signal }, 'Server shut down');
          process.kill(process.pid, signal);
        });
      }));
  }));
