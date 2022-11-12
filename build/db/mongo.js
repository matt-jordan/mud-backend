//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------
import mongoose from 'mongoose';
import config from 'config';
import log from '../lib/log.js';
function getDbUrl() {
    let dbUrl;
    if (config.db.url) {
        dbUrl = config.db.url;
    }
    else if (config.db.atlas) {
        dbUrl = `mongodb+srv://${config.db.atlas.username}:${config.db.atlas.password}@${config.db.atlas.server}/?${config.db.atlas.uriOptions}`;
    }
    else {
        log.error('Failed to construct URL from config parameters');
        throw new Error('Failed to construct URL from config parameters');
    }
    return dbUrl;
}
function initDB() {
    const dbUrl = getDbUrl();
    mongoose.connect(dbUrl, {
        dbName: config.db.database,
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
                log.error('Failed to connect to DB in 5000 ms');
                reject();
            }
        }, 5000);
    });
}
function shutdownDB() {
    return new Promise((resolve, reject) => {
        log.debug('Starting disconnect from database...');
        return mongoose.disconnect()
            .then((result) => {
            log.info('Successfully disconnected from database');
            resolve(result);
        })
            .catch((err) => {
            reject(err);
        });
    });
}
export { initDB, shutdownDB };
