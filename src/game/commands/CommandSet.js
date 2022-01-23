//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

// Default commands
import { LookFactory } from './default/Look.js';
import { MoveFactory } from './default/Move.js';

class CommandSet {
  constructor(name) {
    this.name = name;
    this.commands = {};
  }

  generate(command, tokens) {
    if (!(command in this.commands)) {
      return null;
    }

    return this.commands[command].generate(tokens.filter(t => t));
  }
}

const defaultCommandSet = new CommandSet('default');
defaultCommandSet.commands[LookFactory.name] = new LookFactory(defaultCommandSet);
defaultCommandSet.commands[MoveFactory.name] = new MoveFactory(defaultCommandSet);

export {
  defaultCommandSet as DefaultCommandSet,
};
