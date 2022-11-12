//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import { FakeClient, createWorld, destroyWorld } from '../fixtures.js';
import StunAction from '../../../build/game/combat/StunAction.js';
import Character from '../../../build/game/characters/Character.js';

describe('StunAction', () => {
  let character;

  beforeEach(async () => {
    const results = await createWorld();
    character = results.pc1;
    character.transport = new FakeClient();
  });

  afterEach(async () => {
    await destroyWorld();
  });

  describe('actionType', () => {
    it('returns "effect"', () => {
      const uut = new StunAction({ character });
      assert(uut.actionType === 'effect');
    });
  });

  describe('onExpire', () => {
    it('sends a message saying the effect has expired', () => {
      const uut = new StunAction({ character });
      uut.onExpire();
      assert.match(character.transport.sentMessages[0], /You are no longer stunned/);
    });
  });

  describe('onInitialPush', () => {
    it('sends a message saying the effect started', () => {
      const uut = new StunAction({ character });
      uut.onInitialPush();
      assert.match(character.transport.sentMessages[0], /You are stunned/);
    });
  });

  describe('checkAction', () => {
    ['attack', 'move', 'rest'].forEach((action) => {
      describe(`${action}`, () => {
        it('rejects the action', () => {
          const uut = new StunAction({ character });
          assert(uut.checkAction(action) === false);
          assert.match(character.transport.sentMessages[0], /you are stunned!/);
        });

        it('does not send the message if you are fighting', () => {
          character.currentState = Character.STATE.FIGHTING;
          const uut = new StunAction({ character });
          assert(uut.checkAction(action) === false);
          assert(character.transport.sentMessages.length === 0);
        });
      });
    });

    it('returns true for other actions', () => {
      const uut = new StunAction({ character });
      assert(uut.checkAction('other') === true);
    });
  });

});
