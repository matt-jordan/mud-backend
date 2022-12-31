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
import { RestAction, RestFactory } from '../../../../src/game/commands/default/Rest.js';

describe('RestAction', () => {
  let pc;

  beforeEach(async () => {
    const results = await createWorld();
    pc = results.pc1;
    pc.transport = new FakeClient();
  });

  afterEach(async () => {
    await destroyWorld();
  });

  describe('when fighting', () => {
    it('tells you you cannot rest', () => {
      const uut = new RestAction();
      pc.currentState = Character.STATE.FIGHTING;
      uut.execute(pc);
      assert.match(pc.transport.sentMessages[0], /you are fighting/);
    });
  });

  describe('when you are already resting', () => {
    it('tells you that you are already resting', () => {
      const uut = new RestAction();
      pc.currentState = Character.STATE.RESTING;
      uut.execute(pc);
      assert.match(pc.transport.sentMessages[0], /You are already resting/);
    });
  });

  describe('when everything is fine', () => {
    it('you rest', () => {
      const uut = new RestAction();
      pc.currentState = Character.STATE.NORMAL;
      uut.execute(pc);
      assert(pc.currentState === Character.STATE.RESTING);
      assert.match(pc.transport.sentMessages[0], /You start resting/);
    });
  });
});


describe('RestFactory', () => {
  describe('when generating an action', () => {
    it('generates the action', () => {
      const uut = new RestFactory();
      const result = uut.generate();
      assert(result);
    });
  });
});