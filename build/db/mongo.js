"use strict";
//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.shutdownDB = exports.initDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const config_1 = __importDefault(require("config"));
const log_js_1 = __importDefault(require("../lib/log.js"));
function getDbUrl() {
    let dbUrl;
    if (config_1.default.db.url) {
        dbUrl = config_1.default.db.url;
    }
    else if (config_1.default.db.atlas) {
        dbUrl = `mongodb+srv://${config_1.default.db.atlas.username}:${config_1.default.db.atlas.password}@${config_1.default.db.atlas.server}/?${config_1.default.db.atlas.uriOptions}`;
    }
    else {
        log_js_1.default.error('Failed to construct URL from config parameters');
        throw new Error('Failed to construct URL from config parameters');
    }
    return dbUrl;
}
function initDB() {
    const dbUrl = getDbUrl();
    mongoose_1.default.connect(dbUrl, {
        dbName: config_1.default.db.database,
        useNewUrlParser: true
    });
    const db = mongoose_1.default.connection;
    db.on('error', (err) => {
        log_js_1.default.error({ err }, 'DB Connection Error');
    });
    return new Promise((resolve, reject) => {
        let connected = false;
        db.on('open', () => {
            log_js_1.default.info({ dbUrl }, 'DB Connected');
            connected = true;
            resolve();
        });
        setTimeout(() => {
            if (!connected) {
                log_js_1.default.error('Failed to connect to DB in 5000 ms');
                reject();
            }
        }, 5000);
    });
}
exports.initDB = initDB;
function shutdownDB() {
    return new Promise((resolve, reject) => {
        log_js_1.default.debug('Starting disconnect from database...');
        return mongoose_1.default.disconnect()
            .then((result) => {
            log_js_1.default.info('Successfully disconnected from database');
            resolve(result);
        })
            .catch((err) => {
            reject(err);
        });
    });
}
exports.shutdownDB = shutdownDB;
