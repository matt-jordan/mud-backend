//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import { ErrorAction } from '../../../../src/game/commands/default/Error.js';
import { PartyFactory } from '../../../../src/game/commands/party/PartyFactory.js';
import { PartyAbandon } from '../../../../src/game/commands/party/PartyAbandon.js';
import { PartyAccept } from '../../../../src/game/commands/party/PartyAccept.js';
import { PartyCreate } from '../../../../src/game/commands/party/PartyCreate.js';
import { PartyDecline } from '../../../../src/game/commands/party/PartyDecline.js';
import { PartyInvite } from '../../../../src/game/commands/party/PartyInvite.js';
import { PartyLeave } from '../../../../src/game/commands/party/PartyLeave.js';
import { PartyStatus } from '../../../../src/game/commands/party/PartyStatus.js';

describe.only('PartyFactory', () => {
  describe('generate', () => {

    it('returns an Error when nothing is provided', () => {
      const uut = new PartyFactory();
      const result1 = uut.generate([]);
      assert(result1 instanceof ErrorAction);
      assert(result1.message === 'What do you want to know about your party?');
      const result2 = uut.generate();
      assert(result2 instanceof ErrorAction);
      assert(result2.message === 'What do you want to know about your party?');
    });

    it('returns an error when the sub-command is not understood', () => {
      const uut = new PartyFactory();
      const result = uut.generate(['wat']);
      assert(result instanceof ErrorAction);
      assert(result.message === '\'wat\' is not a valid party command.');
    });

    it('returns PartyAbandon when abandon is specified', () => {
      const uut = new PartyFactory();
      const result = uut.generate(['abandon']);
      assert(result instanceof PartyAbandon);
    });

    it('returns ErrorAction when accept is specified with no target', () => {
      const uut = new PartyFactory();
      const result = uut.generate(['accept']);
      assert(result instanceof ErrorAction);
      assert(result.message === 'Which invite do you want to accept?');
    });

    it('returns PartyAccept when accept is specified with args', () => {
      const uut = new PartyFactory();
      const result = uut.generate(['accept', 'wat']);
      assert(result instanceof PartyAccept);
      assert(result.target === 'wat');
    });

    it('returns PartyCreate when create is specified', () => {
      const uut = new PartyFactory();
      const result = uut.generate(['create']);
      assert(result instanceof PartyCreate);
    });

    it('returns ErrorAction when decline is specified with no target', () => {
      const uut = new PartyFactory();
      const result = uut.generate(['decline']);
      assert(result instanceof ErrorAction);
      assert(result.message === 'Which invite do you want to decline?');
    });

    it('returns PartyDecline when decline is specified with args', () => {
      const uut = new PartyFactory();
      const result = uut.generate(['decline', 'wat']);
      assert(result instanceof PartyDecline);
      assert(result.target === 'wat');
    });

    it('returns PartyInvite when invite is specified with a target', () => {
      const uut = new PartyFactory();
      const result = uut.generate(['invite', 'wat']);
      assert(result instanceof PartyInvite);
      assert(result.target === 'wat');
    });

    it('returns ErrorAction when invite is specified without a target', () => {
      const uut = new PartyFactory();
      const result = uut.generate(['invite']);
      assert(result instanceof ErrorAction);
      assert(result.message === 'Who do you want to invite to your party?');
    });

    it('returns PartyLeave when leave is specified', () => {
      const uut = new PartyFactory();
      const result = uut.generate(['leave']);
      assert(result instanceof PartyLeave);
    });

    it('returns PartyStatus when status is specified', () => {
      const uut = new PartyFactory();
      const result = uut.generate(['status']);
      assert(result instanceof PartyStatus);
    });
  });
});