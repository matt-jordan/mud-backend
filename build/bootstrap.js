//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
import { initWebsocketServer, getWebsocketServer, shutdownWebsocketServer, } from './api/websocket/index.js';
import World from './game/world/World.js';
// TODO: Think about this part...
let world;
function loadWorld() {
    return __awaiter(this, void 0, void 0, function* () {
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
            quests: [],
        };
        try {
            const files = yield fsPromises.readdir(worldPath);
            yield asyncForEach(files, (file) => __awaiter(this, void 0, void 0, function* () {
                const filePath = path.resolve('./world', process.env.NODE_ENV, file);
                log.debug({ filePath }, 'Loading world file');
                rawLoadedData.push(JSON.parse(yield fsPromises.readFile(filePath)));
            }));
            rawLoadedData.forEach(loadedData => {
                ['areas', 'rooms', 'doors', 'spawners', 'factions', 'conversations', 'quests'].forEach((category) => {
                    normalizedData[category].push(...(loadedData[category] ? loadedData[category] : []));
                });
            });
            yield loadObjects(normalizedData);
        }
        catch (err) {
            log.warn({ err, worldPath }, 'Error loading world; skipping');
        }
    });
}
function boot() {
    return __awaiter(this, void 0, void 0, function* () {
        yield initDB();
        yield loadWorld();
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
        yield world.load();
        return httpServer;
    });
}
function shutdown() {
    return __awaiter(this, void 0, void 0, function* () {
        if (world) {
            yield world.shutdown();
        }
        const mb = MessageBus.getInstance();
        mb.shutdown();
        yield shutdownWebsocketServer();
        yield shutdownDB();
    });
}
export { boot, shutdown };
