import assert from 'power-assert';
import EventEmitter from 'events';

import SocketIoConnection from '../../../src/lib/transports/SocketIoConnection.js'

describe('SocketIoConnection', () => {

  let fakeSocket;

  beforeEach(() => {
    fakeSocket = new EventEmitter();
  });

  afterEach(() => {
    fakeSocket = null;
  });

  describe('on disconnect', () => {
    it('emits a disconnect event', done => {
      const conn = new SocketIoConnection(fakeSocket);
      conn.on('disconnect', (conn, reason) => {
        assert(conn);
        assert.equal(reason, 'foobar');
        done();
      });
      fakeSocket.emit('disconnect', 'foobar');
    });
  });

  describe('on message', () => {
    it('emits a message event', done => {
      const conn = new SocketIoConnection(fakeSocket);
      conn.on('message', message => {
        assert.equal(message, 'foo bar');
        done();
      });
      fakeSocket.emit('message', 'foo bar');
    });
  });

  describe('when sending a message', () => {
    it('emits a message on the socket', done => {
      fakeSocket.on('message', message => {
        assert.equal(message, 'it is a message');
        done();
      });
      const conn = new SocketIoConnection(fakeSocket);
      conn.send('it is a message');
    });
  });

  describe('when disconnected', () => {
    describe('without an explicit timeout', () => {
      it('disconnects', done => {
        fakeSocket.disconnect = () => {
          done();
        };
        const conn = new SocketIoConnection(fakeSocket);
        conn.disconnect();
      });
    });

    describe('with an explicit timeout', () => {
      it('disconnects', done => {
        fakeSocket.disconnect = () => {
          done();
        };
        const conn = new SocketIoConnection(fakeSocket);
        conn.disconnect(10);
      });
    });
  });
});