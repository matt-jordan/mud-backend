//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import { ExamineAction, ExamineFactory } from '../../../../src/game/commands/default/Examine.js';
import { FakeClient, createWorld, destroyWorld } from '../../fixtures.js';
import longswordFactory from '../../../../src/game/objects/factories/longsword.js';

describe('ExamineAction', () => {
  let pc;

  beforeEach(async () => {
    const results = await createWorld();
    pc = results.pc1;
    pc.transport = new FakeClient();
    const weapon = await longswordFactory();
    pc.addHauledItem(weapon);
  });

  afterEach(async () => {
    await destroyWorld();
  });

  describe('when the item is not in the player inventory', () => {
    it('tells them it does not exist', async () => {
      const uut = new ExamineAction('backpack');
      await uut.execute(pc);
      assert(pc.transport.sentMessages.length === 1);
      assert.match(pc.transport.sentMessages[0], /You do not see a backpack/);
      assert(pc.inanimates.length === 1);
      assert(pc.room.inanimates.length === 0);
    });
  });

  describe('when the item is in the player inventory', () => {
    it('provides a detailed description', async () => {
      const uut = new ExamineAction('longsword');
      await uut.execute(pc);
      assert(pc.transport.sentMessages.length === 1);
      assert.match(pc.transport.sentMessages[0], /A sword with both a long blade and grip/);
    });
  });

  describe('when the thing being examined is a person', () => {
    it('provides a detailed description', async () => {
      const uut = new ExamineAction(pc.name);
      await uut.execute(pc);
      assert(pc.transport.sentMessages.length === 1);
      assert.match(pc.transport.sentMessages[0], /A complete character/);
    });
  });
});

describe('ExamineFactory', () => {
  describe('when no item is specified', () => {
    it('rejects the action', () => {
      const factory = new ExamineFactory();
      const result = factory.generate();
      assert(result);
      assert(result.message);
      assert.match(result.message, /What do you want to examine/);
    });
  });

  describe('when the item is specified', () => {
    it('generates the action with the expected target', () => {
      const factory = new ExamineFactory();
      const result = factory.generate(['thing']);
      assert(result);
      assert(result.target === 'thing');
    });

    it('handles articles and misc words', () => {
      const factory = new ExamineFactory();
      const result = factory.generate(['the', 'thing']);
      assert(result);
      assert(result.target === 'the thing');
    });
  });
});
