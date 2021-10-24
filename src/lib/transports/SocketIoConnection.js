import EventEmitter from 'events';

import log from '../log.js';

/**
 * A wrapper around a SocketIO socket that gives us some logging.
 *
 * Presumably, it could do more as well, but for now we mostly want to
 * just make sure it emits the right events and logs some messages.
 */
class SocketIoConnection extends EventEmitter {

  /**
   * Create a SocketIOConnection
   * @param {socketIo} socket - The underlying socket.io socket.
   */
  constructor(socket) {
    super();
    this.socket = socket;
    this.id = socket.id;

    this.socket.on('disconnect', reason => {
      log.info({ connId: this.id, reason }, 'Client disconnected');
      /**
       * Disonnect event.
       * @event SocketIOConnection#disconnect
       * @type {Object}
       * @property {SocketIOConnection} conn   - The connection that disconnected.
       * @property {String}             reason - The reason for the disconnect.
       */
      this.emit('disconnect', { conn: this, reason });
    });

    this.socket.on('message', message => {
      log.debug({ connId: this.id, message }, 'Received');

      /**
       * Message event.
       * @event SocketIOConnection#message
       * @param {Object} message - The received message.
       */
      this.emit('message', message);
    });
  }

  /**
   * Send a message to the client
   * @param {String} message - The message to send.
   */
  send(message) {
    log.debug({ connId: this.id, message }, 'Sent');
    this.socket.emit('message', message);
  }

  /**
   * Disconnect the client
   * @param {int} timeout - How long to wait to disconnect.
   */
  disconnect(timeout = 0) {
    log.info({ connId: this.id }, 'Disconnecting client');
    setTimeout(() => this.socket.disconnect(true), timeout);
  }
}

export default SocketIoConnection;