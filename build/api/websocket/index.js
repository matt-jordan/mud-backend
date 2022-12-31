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
exports.shutdownWebsocketServer = exports.getWebsocketServer = exports.initWebsocketServer = void 0;
const ws_1 = require("ws");
const log_js_1 = __importDefault(require("../../lib/log.js"));
let wss;
function heartbeat() {
    this.isAlive = true;
}
function getWebsocketServer() {
    return wss;
}
exports.getWebsocketServer = getWebsocketServer;
function initWebsocketServer(server) {
    wss = new ws_1.WebSocketServer({ noServer: true });
    const interval = setInterval(() => {
        wss.clients.forEach((ws) => {
            if (ws.isAlive === false) {
                log_js_1.default.info({ remoteIp: ws.remoteIp }, 'Terminating orphaned websocket');
                return ws.terminate();
            }
            ws.isAlive = false;
            ws.ping();
        });
    }, 30000);
    wss.on('close', () => {
        clearInterval(interval);
    });
    wss.on('connection', (ws, req) => {
        let remoteIp;
        if ('x-forwarded-for' in req.headers) {
            remoteIp = req.headers['x-forwarded-for'].split(',')[0].trim();
        }
        else {
            remoteIp = req.socket.remoteAddress;
        }
        ws.remoteIp = remoteIp;
        ws.isAlive = true;
        ws.on('pong', heartbeat);
        log_js_1.default.info({ remoteIp }, 'New Websocket connection made');
    });
    server.on('upgrade', (req, socket, head) => {
        wss.handleUpgrade(req, socket, head, (ws) => {
            wss.emit('connection', ws, req);
        });
    });
    return wss;
}
exports.initWebsocketServer = initWebsocketServer;
async function shutdownWebsocketServer() {
    log_js_1.default.info('Shutting down Websocket Server');
    wss.clients.forEach((ws) => {
        log_js_1.default.info({ remoteIp: ws.remoteIp }, 'Terminating connection');
        ws.terminate();
    });
}
exports.shutdownWebsocketServer = shutdownWebsocketServer;
