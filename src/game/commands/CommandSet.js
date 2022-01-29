//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

// Default commands
import { DropItemFactory } from './default/DropItem.js';
import { GetItemFactory } from './default/GetItem.js';
import { InventoryFactory } from './default/Inventory.js';
import { LookFactory } from './default/Look.js';
import { MoveFactory } from './default/Move.js';

/**
 * @module game/commands/CommandSet
 */

/**
 * A set of commands that the player can execute
 */
class CommandSet {

  /**
   * Create a new command set
   *
   * @param {String} name A unique name for the command set
   */
  constructor(name) {
    this.name = name;
    this.commands = {};
  }

  /**
   * Generate a command
   *
   * @param {String} command The command in the command set to generate
   * @param {Array.<String>} tokens The words that should be passed to the
   *                                command
   *
   * @return {Object} A command object to be executed, or null
   */
  generate(command, tokens = []) {
    if (!(command in this.commands)) {
      return null;
    }

    return this.commands[command].generate(tokens.filter(t => t));
  }
}

const defaultCommandSet = new CommandSet('default');
defaultCommandSet.commands[DropItemFactory.name] = new DropItemFactory(defaultCommandSet);
defaultCommandSet.commands[GetItemFactory.name] =  new GetItemFactory(defaultCommandSet);
defaultCommandSet.commands[InventoryFactory.name] = new InventoryFactory(defaultCommandSet);
defaultCommandSet.commands[LookFactory.name] = new LookFactory(defaultCommandSet);
defaultCommandSet.commands[MoveFactory.name] = new MoveFactory(defaultCommandSet);

export {
  /** The default command set **/
  defaultCommandSet as DefaultCommandSet,
};
