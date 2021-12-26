import mongoose from 'mongoose';
import config from 'config';

import log from '../lib/log.js';

function initDB() {
  const dbUrl = `${config.db.url}/${config.db.database}`;
  mongoose.connect(dbUrl, {
    useNewUrlParser: true
  });

  const db = mongoose.connection;
  db.on('error', (err) => {
    log.error({ err }, 'DB Connection Error');
  });

  return new Promise((resolve, reject) => {
    let connected = false;
    db.on('open', () => {
      log.info({ dbUrl }, 'DB Connected');
      connected = true;
      resolve();
    });
    setTimeout(() => {
      if (!connected) {
        log.error({ dbUrl }, 'Failed to connect to DB in 5000 ms');
        reject();
      }
    }, 5000);
  });
}

function shutdownDB() {
  return new Promise((resolve, reject) => {
    return mongoose.disconnect()
      .then((result) => {
        const dbUrl = `${config.db.url}/${config.db.database}`;
        log.info({ dbUrl }, 'Successfully disconnected from database');
        resolve(result);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

export { initDB, shutdownDB };
