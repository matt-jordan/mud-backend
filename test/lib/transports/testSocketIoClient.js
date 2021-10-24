import assert from 'power-assert';
import EventEmitter from 'events';

import SocketIoClient from '../../../src/lib/transports/SocketIoClient.js'

describe('SocketIoClient', () => {

  let fakeSocket;

  beforeEach(() => {
    fakeSocket = new EventEmitter();
  });

  afterEach(() => {
    fakeSocket = null;
  });

  describe('on disconnect', () => {
    it('emits a disconnect event', done => {
      const client = new SocketIoClient(fakeSocket);
      client.on('disconnect', (client, reason) => {
        assert(client);
        assert.equal(reason, 'foobar');
        done();
      });
      fakeSocket.emit('disconnect', 'foobar');
    });
  });

  describe('on message', () => {
    it('emits a message event', done => {
      const client = new SocketIoClient(fakeSocket);
      client.on('message', message => {
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
      const client = new SocketIoClient(fakeSocket);
      client.send('it is a message');
    });
  });

  describe('when disconnected', () => {
    describe('without an explicit timeout', () => {
      it('disconnects', done => {
        fakeSocket.disconnect = () => {
          done();
        };
        const client = new SocketIoClient(fakeSocket);
        client.disconnect();
      });
    });

    describe('with an explicit timeout', () => {
      it('disconnects', done => {
        fakeSocket.disconnect = () => {
          done();
        };
        const client = new SocketIoClient(fakeSocket);
        client.disconnect(10);
      });
    });
  });
});