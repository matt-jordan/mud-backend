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
    } else {
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

async function shutdownWebsocketServer() {
  log.info('Shutting down Websocket Server');
  wss.clients.forEach((ws) => {
    log.info({ remoteIp: ws.remoteIp }, 'Terminating connection');
    ws.terminate();
  });
}

export {
  initWebsocketServer,
  getWebsocketServer,
  shutdownWebsocketServer,
};