//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import HumanNpcFactory from '../../../../src/game/characters/factories/HumanNpcFactory.js';
import PartyMetadataAutoFollow from '../../../../src/game/characters/party/PartyMetadataAutoFollow.js';
import PartyMetadataError from '../../../../src/game/characters/party/PartyMetadataError.js';
import { FakeClient, createWorld, destroyWorld } from '../../fixtures.js';

describe('PartyMetadataAutoFollow', () => {

  describe('validate', () => {

    it('throws when the setting is not known', () => {
      const uut = new PartyMetadataAutoFollow();
      let thrown = false;
      try {
        uut.validate({}, { value: 'wat' }, {});
      } catch (err) {
        assert(err instanceof PartyMetadataError);
        thrown = true;
      }
      assert(thrown);
    });

    it('throws when the setting is "on" and there is no target', () => {
      const uut = new PartyMetadataAutoFollow();
      let thrown = false;
      try {
        uut.validate({}, { value: 'on' }, {});
      } catch (err) {
        assert(err instanceof PartyMetadataError);
        thrown = true;
      }
      assert(thrown);
    });

    it('throws when the target is the same as the old target', () => {
      const target = { toShortText: () => 'foo' };
      const uut = new PartyMetadataAutoFollow();
      let thrown = false;
      try {
        uut.validate({}, { value: 'on', target }, { target });
      } catch (err) {
        assert(err instanceof PartyMetadataError);
        thrown = true;
      }
      assert(thrown);
    });

    it('does not throw when the setting is on and the target is new', () => {
      const newTarget = 'foo';
      const oldTarget = 'bar';
      const uut = new PartyMetadataAutoFollow();
      let thrown = false;
      try {
        uut.validate({}, { value: 'on', target: newTarget }, { target: oldTarget });
      } catch (err) {
        thrown = true;
      }
      assert(!thrown);
    });

    it('throws when the setting is off and there is no one you are following', () => {
      const uut = new PartyMetadataAutoFollow();
      let thrown = false;
      try {
        uut.validate({}, { value: 'off' }, { });
      } catch (err) {
        thrown = true;
      }
      assert(thrown);
    });

    it('does not throw when the setting is off', () => {
      const target = { toShortText: () => 'foo' };
      const uut = new PartyMetadataAutoFollow();
      let thrown = false;
      try {
        uut.validate({}, { value: 'off' }, { target });
      } catch (err) {
        thrown = true;
      }
      assert(!thrown);
    });

  });

  describe('create', () => {
    let pc;
    let follower;
    let otherPC;
    let theWorld;
    let room2;

    beforeEach(async () => {
      const { pc1, world, rooms } = await createWorld();
      pc = pc1;
      theWorld = world;
      room2 = rooms[1];

      pc.transport = new FakeClient();

      const factory = new HumanNpcFactory(theWorld, pc.room);
      follower = await factory.generate({ humanNpc: { name: 'follower' }});
      follower.transport = new FakeClient();
      theWorld.addCharacter(follower);

      otherPC = await factory.generate({ humanNpc: { name: 'otherPC' }});
      otherPC.transport = new FakeClient();
      theWorld.addCharacter(otherPC);
    });

    afterEach(async () => {
      await destroyWorld();
    });

    describe('when they are not in the same room', () => {
      beforeEach(() => {
        pc.moveToRoom(room2);
      });

      it('does not trigger a move', () => {
        const uut = new PartyMetadataAutoFollow();
        uut.create(follower, { value: 'on', target: pc }, {});
        pc.moveToRoom(room2);
        assert(pc.listeners('move').length === 1);
        assert(follower.room !== room2);
      });
    });

    describe('when the setting is off and the character was following', () => {
      it('removes the listener', () => {
        const uut = new PartyMetadataAutoFollow();
        const oldVal = uut.create(follower, { value: 'on', target: pc }, {});
        assert(pc.listeners('move').length === 1);
        uut.create(follower, { value: 'off' }, oldVal);
        assert(pc.listeners('move').length === 0);
      });
    });

    describe('when the setting is on', () => {
      describe('and the character was following someone', () => {
        it('removes the listener and triggers a move', () => {
          const uut = new PartyMetadataAutoFollow();
          const oldVal = uut.create(follower, { value: 'on', target: pc }, {});
          assert(pc.listeners('move').length === 1);
          uut.create(follower, { value: 'on', target: otherPC }, oldVal);
          assert(pc.listeners('move').length === 0);
          assert(otherPC.listeners('move').length === 1);
          otherPC.moveToRoom(room2);
          assert(follower.room === room2);
        });
      });

      describe('and the character was not following someone', () => {
        it('triggers on move', async () => {
          const uut = new PartyMetadataAutoFollow();
          uut.create(follower, { value: 'on', target: pc }, {});
          assert(pc.listeners('move').length === 1);
          pc.moveToRoom(room2);
          assert(follower.room === room2);
        });
      });
    });
  });

});