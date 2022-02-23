//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import { FakeClient, createWorld, destroyWorld } from '../../fixtures.js';
import Character from '../../../../src/game/characters/Character.js';
import { StandAction, StandFactory } from '../../../../src/game/commands/default/Stand.js';

describe('StandAction', () => {
  let pc;

  beforeEach(async () => {
    const results = await createWorld();
    pc = results.pc1;
    pc.transport = new FakeClient();
  });

  afterEach(async () => {
    await destroyWorld();
  });

  describe('when you are resting', () => {
    it('tells you that you stand up', () => {
      const uut = new StandAction();
      pc.currentState = Character.STATE.RESTING;
      uut.execute(pc);
      assert(pc.currentState === Character.STATE.NORMAL);
      assert.match(pc.transport.sentMessages[0], /You stand up/);
    });
  });

  describe('when you are not resting', () => {
    it('tells you that you are already standing', () => {
      const uut = new StandAction();
      uut.execute(pc);
      assert.match(pc.transport.sentMessages[0], /You are already standing/);
    });
  });
});


describe('StandFactory', () => {
  describe('when generating an action', () => {
    it('generates the action', () => {
      const uut = new StandFactory();
      const result = uut.generate();
      assert(result);
    });
  });
});