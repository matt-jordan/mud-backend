//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import { DefaultCommandSet } from '../../../build/game/commands/CommandSet.js';
import { LookFactory } from '../../../build/game/commands/default/Look.js';

describe('DefaultCommandSet', () => {
  describe('generate', () => {
    it('returns null for a command not in its set', () => {
      const result = DefaultCommandSet.generate('foo', []);
      assert(result === null);
    });

    describe(`${LookFactory.name}`, () => {
      it('generates the command', () => {
        const result = DefaultCommandSet.generate(LookFactory.name, []);
        assert(result);
      });
    });
  });
});