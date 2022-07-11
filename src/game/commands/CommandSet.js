//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

// Default commands
import { AttackFactory } from './default/Attack.js';
import { DropItemFactory } from './default/DropItem.js';
import { ErrorFactory } from './default/Error.js';
import { GetItemFactory } from './default/GetItem.js';
import { InventoryFactory } from './default/Inventory.js';
import { LookFactory } from './default/Look.js';
import { MoveFactory } from './default/Move.js';
import { PutItemFactory } from './default/PutItem.js';
import { RemoveItemFactory } from './default/RemoveItem.js';
import { RestFactory } from './default/Rest.js';
import { StandFactory } from './default/Stand.js';
import { WearItemFactory } from './default/WearItem.js';

// Social commands
import { SayFactory } from './social/Say.js';

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
    this.errorFactory = new ErrorFactory();
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
    if (!(command.toLowerCase() in this.commands)) {
      return null;
    }

    return this.commands[command.toLowerCase()].generate(tokens.filter(t => t));
  }
}

const defaultCommandSet = new CommandSet('default');
defaultCommandSet.commands[AttackFactory.name] = new AttackFactory(defaultCommandSet);
defaultCommandSet.commands[DropItemFactory.name] = new DropItemFactory(defaultCommandSet);
defaultCommandSet.commands[GetItemFactory.name] =  new GetItemFactory(defaultCommandSet);
defaultCommandSet.commands[InventoryFactory.name] = new InventoryFactory(defaultCommandSet);
defaultCommandSet.commands[LookFactory.name] = new LookFactory(defaultCommandSet);
defaultCommandSet.commands[MoveFactory.name] = new MoveFactory(defaultCommandSet);
defaultCommandSet.commands[PutItemFactory.name] = new PutItemFactory(defaultCommandSet);
defaultCommandSet.commands[RemoveItemFactory.name] = new RemoveItemFactory(defaultCommandSet);
defaultCommandSet.commands[RestFactory.name] = new RestFactory(defaultCommandSet);
defaultCommandSet.commands[StandFactory.name] = new StandFactory(defaultCommandSet);
defaultCommandSet.commands[WearItemFactory.name] = new WearItemFactory(defaultCommandSet);
defaultCommandSet.commands[ErrorFactory.name] = new ErrorFactory(defaultCommandSet);

const socialCommandSet = new CommandSet('social');
socialCommandSet.commands[SayFactory.name] = new SayFactory(socialCommandSet);

export {
  /** The default command set **/
  defaultCommandSet as DefaultCommandSet,
  socialCommandSet as SocialCommandSet,
};
