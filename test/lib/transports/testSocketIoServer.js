import assert from 'power-assert';
import EventEmitter from 'events';

import SocketIoServer from '../../../src/lib/transports/SocketIoServer.js';


class FakeSocket extends EventEmitter {
  constructor() {
    super();
    this.server = null;
  }

  attach(httpServer) {
    this.server = httpServer;
  }

  disconnect() {
    this.emit('disconnect', 'disconnect called');
  }
}

describe('SocketIoServer', () => {

  it('creates a socket and attaches to a server', () => {
    const fakeServer = {};
    const fakeSocket = new FakeSocket();
    const uut = new SocketIoServer(fakeServer, fakeSocket);
    assert.equal(uut.io.server, fakeServer);
  });

  describe('when a connection occurs', () => {

    it('raises its own connection event', done => {
      const fakeServer = {};
      const fakeSocket = new FakeSocket();
      const uut = new SocketIoServer(fakeServer, fakeSocket);
      uut.on('connection', (conn) => {
        assert(conn);
        assert.equal(uut.connections.length, 1);
        done();
      });

      uut.io.emit('connection', new EventEmitter());
    });

    it('tracks the lifecycle of the connection', () => {
      const fakeServer = {};
      const fakeSocket = new FakeSocket();
      const uut = new SocketIoServer(fakeServer, fakeSocket);

      const socket = new EventEmitter();
      uut.io.emit('connection', socket);
      assert.equal(uut.connections.length, 1);

      socket.emit('disconnect', 'why not');
      assert.equal(uut.connections.length, 0);
    });

  });

  describe('disconnectAll', () => {
    it('disconnects all active connections', (done) => {
      let disconnects = 0;
      const fakeServer = {};
      const fakeSocket = new FakeSocket();
      const uut = new SocketIoServer(fakeServer, fakeSocket);

      const socket1 = new FakeSocket();
      uut.io.emit('connection', socket1);
      assert.equal(uut.connections.length, 1);

      const socket2 = new FakeSocket();
      uut.io.emit('connection', socket2);
      assert.equal(uut.connections.length, 2);

      uut.disconnectAll();

      const testFn = () => {
        disconnects += 1;
        if (disconnects === 2) {
          assert.equal(uut.connections.length, 0);
          done();
        }
      };

      socket1.on('disconnect', testFn);
      socket2.on('disconnect', testFn);
    });
  });
});
