import EventEmitter from 'events';
//import { Server as socketIo from 'socket.io';

import SocketIoConnection from './SocketIoConnection.js';
import log from '../log.js';

/**
 * A SocketIOServer that manages connected clients
 */
class SocketIoServer extends EventEmitter {

  /**
   * Create a SocketIOServer.
   * @param {HTTPServer} httpServer       - The HTTP Server to attach to.
   * @param {socketIo}   socketContructor - The constructor function for the SocketIO client.
   */
  constructor(httpServer, socketConstructor) {
    super();
    this.io = socketConstructor();
    this.io.attach(httpServer);
    this.connections = [];

    this.io.on('connection', socket => {
      const conn = new SocketIoConnection(socket);
      log.info({ connId: conn.id }, 'New socket.io connection');
      this.connections.push(conn);

      conn.on('disconnect', args => {
        const { conn } = args;
        const index = this.connections.indexOf(conn);
        if (index > -1) {
          this.connections.splice(index, 1);
        }
      });

      /**
       * Connection event.
       * @event SocketIOServer#connection
       * @type {SocketIOConnection} conn - The connection that connected.
       */
      this.emit('connection', conn);
    });
  }

  /**
   * Disconnect all connections.
   */
  disconnectAll() {
    log.info('Disconnecting all socket.io connections');
    this.connections.forEach(conn => {
      conn.disconnect();
    });
  }
}

export default SocketIoServer;