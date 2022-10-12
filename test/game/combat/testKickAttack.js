//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import { FakeClient, createWorld, destroyWorld } from '../fixtures.js';
import KickAttack from '../../../src/game/combat/KickAttack.js';
import Character from '../../../src/game/characters/Character.js';
import HumanNpcFactory from '../../../src/game/characters/factories/HumanNpcFactory.js';

describe('KickAttack', () => {
  let pc;
  let npc;

  beforeEach(async () => {
    const results = await createWorld();
    pc = results.pc1;
    pc.transport = new FakeClient();

    const factory = new HumanNpcFactory(results.world, pc.room);
    npc = await factory.generate();
    npc.transport = new FakeClient();

    pc.room.combatManager.addCombat(pc, npc);
    pc.skills.set('kick', 1);
    pc.room.combatManager.addCombat(npc, pc);
  });

  afterEach(async () => {
    await destroyWorld();
  });

  describe('canPerformAction', () => {
    describe('when exhausted', () => {
      beforeEach(() => {
        pc.attributes.energypoints.current = 0;
      });

      it('returns false', () => {
        const uut = new KickAttack(pc, npc);
        assert(uut.canPerformAction() === false);
        assert(pc.transport.sentMessages.some(msg => msg.includes('exhausted')));
      });
    });

    describe('when you are already performing a kick', () => {
      beforeEach(() => {
        pc.attackActions.push(new KickAttack(pc, npc));
      });

      it('returns false', () => {
        const uut = new KickAttack(pc, npc);
        assert(uut.canPerformAction() === false);
        assert(pc.transport.sentMessages.some(msg => msg.includes('You are already about to perform a special attack')));
      });
    });

    describe('when you do not know how to kick', () => {
      beforeEach(() => {
        pc.skills.set('kick', 0);
      });

      it('tells you that', () => {
        const uut = new KickAttack(pc, npc);
        assert(uut.canPerformAction() === false);
        assert(pc.transport.sentMessages.some(msg => msg.includes('You do not know how to kick')));
      });
    })
  });

  describe('specialEffect', () => {
    describe('when the attack fails', () => {
      it('nothing happens', () => {
        const uut = new KickAttack(pc, npc);
        KickAttack.kickDice.setNextResults([1, 20]);
        uut.specialEffect(pc.room.combatManager.getCombat(pc));
        assert(!npc.transport.sentMessages.some(msg => msg.includes('stunned')));
      });
    });

    describe('when the attack succeeds', () => {
      it('stuns the target', () => {
        const uut = new KickAttack(pc, npc);
        KickAttack.kickDice.setNextResults([20, 1]);
        uut.specialEffect(pc.room.combatManager.getCombat(pc));
        assert(npc.transport.sentMessages.some(msg => msg.includes('stunned')));
      });
    });
  });
});
