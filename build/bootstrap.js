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
exports.shutdown = exports.boot = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const http_shutdown_1 = __importDefault(require("http-shutdown"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const MessageBus_js_1 = __importDefault(require("./lib/messagebus/MessageBus.js"));
const log_js_1 = __importDefault(require("./lib/log.js"));
const asyncForEach_js_1 = __importDefault(require("./lib/asyncForEach.js"));
const mongo_js_1 = require("./db/mongo.js");
const loader_js_1 = __importDefault(require("./db/loader.js"));
const index_js_1 = __importDefault(require("./api/controllers/index.js"));
const index_js_2 = require("./api/middleware/index.js");
const index_js_3 = require("./api/websocket/index.js");
const World_js_1 = __importDefault(require("./game/world/World.js"));
// TODO: Think about this part...
let world;
async function loadWorld() {
    const fsPromises = fs_1.default.promises;
    const worldPath = path_1.default.resolve('./world', process.env.NODE_ENV);
    log_js_1.default.debug({ worldPath }, 'Loading world definition');
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
        const files = await fsPromises.readdir(worldPath);
        await (0, asyncForEach_js_1.default)(files, async (file) => {
            const filePath = path_1.default.resolve('./world', process.env.NODE_ENV, file);
            log_js_1.default.debug({ filePath }, 'Loading world file');
            rawLoadedData.push(JSON.parse(await fsPromises.readFile(filePath)));
        });
        rawLoadedData.forEach(loadedData => {
            ['areas', 'rooms', 'doors', 'spawners', 'factions', 'conversations', 'quests'].forEach((category) => {
                normalizedData[category].push(...(loadedData[category] ? loadedData[category] : []));
            });
        });
        await (0, loader_js_1.default)(normalizedData);
    }
    catch (err) {
        log_js_1.default.warn({ err, worldPath }, 'Error loading world; skipping');
    }
}
async function boot() {
    await (0, mongo_js_1.initDB)();
    await loadWorld();
    const app = (0, express_1.default)();
    app.use((req, res, next) => {
        res.set('x-powered-by', 'hope');
        next();
    });
    app.set('trust proxy', true);
    app.use(express_1.default.static('dist'));
    (0, index_js_2.initMiddleware)(app);
    (0, index_js_1.default)(app);
    // This must be last
    (0, index_js_2.finalizeMiddleware)(app);
    const httpServer = (0, http_shutdown_1.default)(http_1.default.createServer(app));
    (0, index_js_3.initWebsocketServer)(httpServer);
    world = World_js_1.default.getInstance((0, index_js_3.getWebsocketServer)());
    await world.load();
    return httpServer;
}
exports.boot = boot;
async function shutdown() {
    if (world) {
        await world.shutdown();
    }
    const mb = MessageBus_js_1.default.getInstance();
    mb.shutdown();
    await (0, index_js_3.shutdownWebsocketServer)();
    await (0, mongo_js_1.shutdownDB)();
}
exports.shutdown = shutdown;
