//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import { ErrorAction, ErrorFactory } from '../../../../build/game/commands/default/Error.js';

describe('ErrorAction', () => {
  it('defers to using message if available', (done) => {
    const uut = new ErrorAction({ message: 'foobar', command: 'foo' });
    uut.execute({
      sendImmediate: (msg) => {
        assert(msg);
        assert(msg === 'foobar');
        done();
      }
    });
  });

  it('sends the expected error to the character', (done) => {
    const uut = new ErrorAction({ command: 'foo', parameters: [] });
    uut.execute({
      sendImmediate: (msg) => {
        assert(msg);
        assert(msg === 'You don\'t know how to \'foo\'');
        done();
      },
    });
  });
});

describe('ErrorFactory', () => {
  it('generates an error with the expected properties', () => {
    const uut = new ErrorFactory();
    const result = uut.generate('foo', ['bar', 'bar', 'bar']);
    assert(result.command === 'foo');
    assert(result.parameters === 'bar bar bar');
  });
});
