//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import Character from  '../../../../build/game/characters/Character.js';
import HumanNpcFactory from '../../../../build/game/characters/factories/HumanNpcFactory.js';
import PartyMetadataAutoAttack from '../../../../build/game/characters/party/PartyMetadataAutoAttack.js';
import PartyMetadataError from '../../../../build/game/characters/party/PartyMetadataError.js';
import { FakeClient, createWorld, destroyWorld } from '../../fixtures.js';

describe('PartyMetadataAutoAttack', () => {

  describe('validate', () => {

    it('throws when the setting is not known', () => {
      const uut = new PartyMetadataAutoAttack();
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
      const uut = new PartyMetadataAutoAttack();
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
      const uut = new PartyMetadataAutoAttack();
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
      const uut = new PartyMetadataAutoAttack();
      let thrown = false;
      try {
        uut.validate({}, { value: 'on', target: newTarget }, { target: oldTarget });
      } catch (err) {
        thrown = true;
      }
      assert(!thrown);
    });

    it('throws when the setting is off and there is no one you are auto-attacking with', () => {
      const uut = new PartyMetadataAutoAttack();
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
      const uut = new PartyMetadataAutoAttack();
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

      it('does not trigger an attack', async () => {
        const uut = new PartyMetadataAutoAttack();
        uut.create(follower, { value: 'on', target: pc }, {});
        pc.moveToRoom(room2);
        otherPC.moveToRoom(room2);
        room2.combatManager.addCombat(pc, otherPC);
        room2.combatManager.addCombat(otherPC, pc);
        room2.combatManager.getCombat(pc).setNextAttackRoll(1);
        room2.combatManager.getCombat(otherPC).setNextAttackRoll(1);
        await room2.onTick();
        assert(pc.listeners('attack').length === 1);
        assert(follower.currentState === Character.STATE.NORMAL);
      });
    });

    describe('when the setting is off and the character was following', () => {
      it('removes the listener', () => {
        const uut = new PartyMetadataAutoAttack();
        const oldVal = uut.create(follower, { value: 'on', target: pc }, {});
        assert(pc.listeners('attack').length === 1);
        uut.create(follower, { value: 'off' }, oldVal);
        assert(pc.listeners('attack').length === 0);
      });
    });

    describe('when the setting is on', () => {
      describe('and the character was following someone', () => {
        it('removes the listener and triggers an attack', async () => {
          const uut = new PartyMetadataAutoAttack();
          const oldVal = uut.create(follower, { value: 'on', target: pc }, {});
          assert(pc.listeners('attack').length === 1);
          uut.create(follower, { value: 'on', target: otherPC }, oldVal);
          assert(pc.listeners('attack').length === 0);
          assert(otherPC.listeners('attack').length === 1);

          pc.room.combatManager.addCombat(pc, otherPC);
          pc.room.combatManager.addCombat(otherPC, pc);
          pc.room.combatManager.getCombat(pc).setNextAttackRoll(1);
          pc.room.combatManager.getCombat(otherPC).setNextAttackRoll(1);
          await pc.room.onTick();
          assert(follower.currentState === Character.STATE.FIGHTING);
        });
      });

      describe('and the character was not following someone', () => {
        it('triggers an attack', async () => {
          const uut = new PartyMetadataAutoAttack();
          uut.create(follower, { value: 'on', target: pc }, {});
          assert(pc.listeners('attack').length === 1);

          pc.room.combatManager.addCombat(pc, otherPC);
          pc.room.combatManager.addCombat(otherPC, pc);
          pc.room.combatManager.getCombat(pc).setNextAttackRoll(1);
          pc.room.combatManager.getCombat(otherPC).setNextAttackRoll(1);
          await pc.room.onTick();
          assert(follower.currentState === Character.STATE.FIGHTING);
        });
      });
    });
  });

});