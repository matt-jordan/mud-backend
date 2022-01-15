import assert from 'power-assert';
import EventEmitter from 'events';
import mongoose from 'mongoose';

import World from '../../../src/game/world/world.js';
import AreaModel from '../../../src/db/models/Area.js';
import RoomModel from '../../../src/db/models/Room.js';
import CharacterModel from '../../../src/db/models/Character.js';
import SessionModel from '../../../src/db/models/Session.js';

class FakeClient extends EventEmitter {
  constructor(msgCb) {
    super();
    this.receivedMessage = null;
    this.closed = false;
    this.msgCb = msgCb;
  }

  send(message) {
    if (this.msgCb && !this.receivedMessage) {
      this.msgCb(message);
    }
    this.receivedMessage = message;
  }

  close() {
    this.closed = true;
  }
}

describe('World', () => {

  let room1_2_id;
  let room2_2_id;

  const fakeTransport = new EventEmitter();

  beforeEach(async () => {
    const room1_1 = new RoomModel();
    room1_1.name = 'Room1_1';
    const room1_2 = new RoomModel();
    room1_2.name = 'Room1_2';

    room1_2_id = room1_2._id.toString();

    const area1 = new AreaModel();
    area1.name = 'TestArea1';
    area1.roomIds.push(room1_1._id);
    area1.roomIds.push(room1_2._id);
    room1_1.areaId = area1._id;
    room1_2.areaId = area1._id;
    await room1_1.save();
    await room1_2.save();
    await area1.save();

    const room2_1 = new RoomModel();
    room2_1.name = 'Room2_1';
    const room2_2 = new RoomModel();
    room2_2.name = 'Room2_2';

    room2_2_id = room2_2._id.toString();

    const area2 = new AreaModel();
    area2.name = 'TestArea2';
    area2.roomIds.push(room2_1._id);
    area2.roomIds.push(room2_2._id);
    room2_1.areaId = area2._id;
    room2_2.areaId = area2._id;
    await room2_1.save();
    await room2_2.save();
    await area2.save();
  });

  afterEach(async () => {
    await AreaModel.deleteMany();
    await RoomModel.deleteMany();
  });

  describe('World', () => {
    describe('transport', () => {
      describe('connections', () => {
        it('tracks a new connection', () => {
          const world = new World(fakeTransport);
          assert(world);

          const fakeClient = new EventEmitter();
          fakeTransport.emit('connection', fakeClient);
          assert(world.clients.length === 1);
          assert(world.clients[0] === fakeClient);
        });

        it('removes connections when they disconnect', () => {
          const world = new World(fakeTransport);
          assert(world);

          const fakeClient = new EventEmitter();
          fakeTransport.emit('connection', fakeClient);
          assert(world.clients.length === 1);
          fakeClient.emit('close', 'no reason');
          assert(world.clients.length === 0);
        });
      });

      describe('message handling', () => {
        it('handles malformed messages', () => {
          const fakeClient = new FakeClient();
          const world = new World(fakeTransport);
          assert(world);
          fakeTransport.emit('connection', fakeClient);

          fakeClient.emit('message', 'foobar');
          assert(fakeClient.receivedMessage);
          assert(JSON.parse(fakeClient.receivedMessage).error === 'BadMessage');
        });

        describe('auth', () => {
          beforeEach(async () => {
            const session = new SessionModel();
            session.accountId = new mongoose.Types.ObjectId();
            session.sessionId = 'foobar';
            await session.save();
          });

          afterEach(async () => {
            await SessionModel.deleteMany();
          });

          it('rejects if there is no token', () => {
            const world = new World(fakeTransport);
            assert(world);

            const fakeClient = new FakeClient();
            fakeTransport.emit('connection', fakeClient);
            fakeClient.emit('message', JSON.stringify({ messageType: 'Test' }));
          });

          it('rejects if the token is invalid', (done) => {
            const world = new World(fakeTransport);
            assert(world);

            const fakeClient = new FakeClient((message) => {
              assert(message);
              assert(JSON.parse(message).error === 'Unauthorized');
              done();
            });
            fakeTransport.emit('connection', fakeClient);
            fakeClient.emit('message', JSON.stringify({
              auth: 'foo',
              messageType: 'Test',
            }));
          });

          it('passes if the token is valid', () => {
            const world = new World(fakeTransport);
            assert(world);

            const fakeClient = new FakeClient();
            fakeTransport.emit('connection', fakeClient);
            fakeClient.emit('message', JSON.stringify({
              auth: 'foobar',
              messageType: 'Test',
            }));
            assert(!fakeClient.receivedMessage);
          });
        });

        describe('LoginCharacter', () => {
          let character;

          beforeEach(async () => {
            character = new CharacterModel();
            character.name = 'foo';
            character.accountId = new mongoose.Types.ObjectId();
            await character.save();
          });

          it('fails if no characterId exists', (done) => {
            const world = new World(fakeTransport);
            assert(world);

            const fakeClient = new FakeClient((message) => {
              assert(message);
              assert(JSON.parse(message).error === 'BadMessage');
              done();
            });
            fakeTransport.emit('connection', fakeClient);
            fakeClient.emit('message', JSON.stringify({
              auth: 'foobar',
              messageType: 'LoginCharacter',
            }));
          });

          it('fails if the character does not exist', (done) => {
            const world = new World(fakeTransport);
            assert(world);

            const fakeClient = new FakeClient((message) => {
              assert(message);
              assert(JSON.parse(message).error === 'BadMessage');
              done();
            });
            fakeTransport.emit('connection', fakeClient);
            fakeClient.emit('message', JSON.stringify({
              auth: 'foobar',
              messageType: 'LoginCharacter',
              characterId: '00df835ae437a726fb9ef328'
            }));
          });

          it('logs in the character', () => {
            const world = new World(fakeTransport);
            assert(world);

            const fakeClient = new FakeClient();
            fakeTransport.emit('connection', fakeClient);
            fakeClient.emit('message', JSON.stringify({
              auth: 'foobar',
              messageType: 'LoginCharacter',
              characterId: character._id.toString(),
            }));
          });

          it('does not not log in a character twice', () => {
            const world = new World(fakeTransport);
            assert(world);

            const fakeClient = new FakeClient();
            fakeTransport.emit('connection', fakeClient);
            fakeClient.emit('message', JSON.stringify({
              auth: 'foobar',
              messageType: 'LoginCharacter',
              characterId: character._id.toString(),
            }));
            fakeClient.emit('message', JSON.stringify({
              auth: 'foobar',
              messageType: 'LoginCharacter',
              characterId: character._id.toString(),
            }));
          });
        });

      });
    });

    describe('load', () => {
      it('loads the world', async () => {
        const world = new World(fakeTransport);
        await world.load();

        assert(world.areas.length === 2);
        assert(world.areas[0].rooms.length === 2);
        assert(world.areas[1].rooms.length === 2);
      });
    });

    describe('findRoomById', () => {
      it('returns a valid room', async () => {
        const world = new World(fakeTransport);
        await world.load();

        const room1_2 = world.findRoomById(room1_2_id);
        assert(room1_2);
        assert(room1_2.id === room1_2_id);

        const room2_2 = world.findRoomById(room2_2_id);
        assert(room2_2);
        assert(room2_2.id === room2_2_id);
      });

      it('returns null when the room is invalid', async () => {
        const world = new World(fakeTransport);
        await world.load();

        const room = world.findRoomById('unknown');
        assert(room === null);
      });
    });
  });
});