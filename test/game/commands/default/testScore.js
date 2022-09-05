//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import { FakeClient, createWorld, destroyWorld } from '../../fixtures.js';
import { ScoreAction, ScoreFactory } from '../../../../src/game/commands/default/Score.js';


describe('ScoreAction', () => {
  let pc;

  beforeEach(async () => {
    const results = await createWorld();
    pc = results.pc1;
    pc.transport = new FakeClient();
  });

  afterEach(async () => {
    await destroyWorld();
  });

  describe('for a newly minted character', () => {
    it('describes their current vitals', () => {
      const action = new ScoreAction();
      action.execute(pc);
      assert(pc.transport.sentMessages.length === 1);
      assert.match(pc.transport.sentMessages[0], /You are a medium non-binary human/);
      assert.match(pc.transport.sentMessages[0], /L1 fighter/);
      assert.match(pc.transport.sentMessages[0], /weighing about 175 lbs/);
      assert.match(pc.transport.sentMessages[0], /You are uninjured/);
      assert.match(pc.transport.sentMessages[0], /You are full of energy/);
      assert.match(pc.transport.sentMessages[0], /You are filled with the energy of the universe/);
      assert.match(pc.transport.sentMessages[0], /scholar: 0/);
      assert.match(pc.transport.sentMessages[0], /observation: 0/);
    });
  });
});


describe('ScoreFactory', () => {
  it('generates the expected action', () => {
    const uut = new ScoreFactory();
    assert(uut);
    const action = uut.generate();
    assert(action);
    assert(action instanceof ScoreAction);
  });
});