//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import HumanNpcFactory from '../../../../src/game/characters/factories/HumanNpcFactory.js';
import { FakeClient, createWorld, destroyWorld } from '../../fixtures.js';
import { KillFactory, KillAction } from '../../../../src/game/commands/admin/Kill.js';

describe('KillAction', () => {
  let pc;
  let npc;

  beforeEach(async () => {
    const { pc1, world } = await createWorld();
    pc = pc1;
    pc.transport = new FakeClient();

    const factory = new HumanNpcFactory(world, pc.room);
    npc = await factory.generate({ humanNpc: { name: 'test-character' }});
    npc.transport = new FakeClient();
  });

  afterEach(async () => {
    await destroyWorld();
  });

  describe('when the target is not in the room', () => {
    it('tells you that', async () => {
      const uut = new KillAction('foo');
      await uut.execute(pc);
      assert(pc.transport.sentMessages.some(msg => msg.includes('You do not see \'foo\' here')));
    });
  });

  describe('when the target is yourself', () => {
    it('says hey, do not do that', async () => {
      const uut = new KillAction(pc.name);
      await uut.execute(pc);
      assert(pc.transport.sentMessages.some(msg => msg.includes('You cannot kill yourself')));
    });
  });

  describe('when the target is in the room', () => {
    it('auto-kills the target', async () => {
      // NPC's transport will be thrown away when the die
      const messages = [];
      npc.transport.sentMessageCb = (msg) => {
        messages.push(msg);
      }
      const uut = new KillAction('test-character');
      await uut.execute(pc);
      assert(messages.some(msg => msg.includes('You have died')));
      assert(npc.attributes.hitpoints.current === 0);
    });
  });
});

describe('KillFactory', () => {
  it('returns an error if you do not specify a target', () => {
    const uut = new KillFactory();
    const result = uut.generate([]);
    assert(result);
    assert(!(result instanceof KillAction));
    assert(result.message);
  });

  it('generates the action if you do specify a target', () => {
    const uut = new KillFactory();
    const result = uut.generate(['foo']);
    assert(result);
    assert(result instanceof KillAction);
    assert(result.target === 'foo');
  });

  it('generates the action if you specify a compound target', () => {
    const uut = new KillFactory();
    const result = uut.generate(['foo', 'bar']);
    assert(result);
    assert(result instanceof KillAction);
    assert(result.target === 'foo bar');
  });
});

