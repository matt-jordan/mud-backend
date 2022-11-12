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
import { WebSocketServer } from 'ws';
import log from '../../lib/log.js';
let wss;
function heartbeat() {
    this.isAlive = true;
}
function getWebsocketServer() {
    return wss;
}
function initWebsocketServer(server) {
    wss = new WebSocketServer({ noServer: true });
    const interval = setInterval(() => {
        wss.clients.forEach((ws) => {
            if (ws.isAlive === false) {
                log.info({ remoteIp: ws.remoteIp }, 'Terminating orphaned websocket');
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
        log.info({ remoteIp }, 'New Websocket connection made');
    });
    server.on('upgrade', (req, socket, head) => {
        wss.handleUpgrade(req, socket, head, (ws) => {
            wss.emit('connection', ws, req);
        });
    });
    return wss;
}
function shutdownWebsocketServer() {
    return __awaiter(this, void 0, void 0, function* () {
        log.info('Shutting down Websocket Server');
        wss.clients.forEach((ws) => {
            log.info({ remoteIp: ws.remoteIp }, 'Terminating connection');
            ws.terminate();
        });
    });
}
export { initWebsocketServer, getWebsocketServer, shutdownWebsocketServer, };
