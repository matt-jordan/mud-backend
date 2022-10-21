//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

// Default commands
import { AttackFactory } from './default/Attack.js';
import { CloseFactory } from './default/Close.js';
import { DropItemFactory } from './default/DropItem.js';
import { ErrorFactory } from './default/Error.js';
import { ExamineFactory } from './default/Examine.js';
import { GetItemFactory } from './default/GetItem.js';
import { InventoryFactory } from './default/Inventory.js';
import { LookFactory } from './default/Look.js';
import { MoveFactory } from './default/Move.js';
import { OpenFactory } from './default/Open.js';
import { PartyFactory} from './party/PartyFactory.js';
import { PutItemFactory } from './default/PutItem.js';
import { QuestFactory } from './default/Quest.js';
import { RemoveItemFactory } from './default/RemoveItem.js';
import { RestFactory } from './default/Rest.js';
import { ScoreFactory } from './default/Score.js';
import { StandFactory } from './default/Stand.js';
import { WearItemFactory } from './default/WearItem.js';

// Social commands
import { SayFactory } from './social/Say.js';
import { ShoutFactory } from './social/Shout.js';

// Combat commands
import { KickFactory } from './combat/Kick.js';

// Admin commands
import { KillFactory } from './admin/Kill.js';

// Priest commands
import { ChantFactory } from './priest/Chant.js';

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
defaultCommandSet.commands[CloseFactory.name] = new CloseFactory(defaultCommandSet);
defaultCommandSet.commands[DropItemFactory.name] = new DropItemFactory(defaultCommandSet);
defaultCommandSet.commands[ExamineFactory.name] = new ExamineFactory(defaultCommandSet);
defaultCommandSet.commands[GetItemFactory.name] =  new GetItemFactory(defaultCommandSet);
defaultCommandSet.commands[InventoryFactory.name] = new InventoryFactory(defaultCommandSet);
defaultCommandSet.commands[LookFactory.name] = new LookFactory(defaultCommandSet);
defaultCommandSet.commands[MoveFactory.name] = new MoveFactory(defaultCommandSet);
defaultCommandSet.commands[OpenFactory.name] = new OpenFactory(defaultCommandSet);
defaultCommandSet.commands[PartyFactory.name] = new PartyFactory(defaultCommandSet);
defaultCommandSet.commands[PutItemFactory.name] = new PutItemFactory(defaultCommandSet);
defaultCommandSet.commands[QuestFactory.name] = new QuestFactory(defaultCommandSet);
defaultCommandSet.commands[RemoveItemFactory.name] = new RemoveItemFactory(defaultCommandSet);
defaultCommandSet.commands[RestFactory.name] = new RestFactory(defaultCommandSet);
defaultCommandSet.commands[ScoreFactory.name] = new ScoreFactory(defaultCommandSet);
defaultCommandSet.commands[StandFactory.name] = new StandFactory(defaultCommandSet);
defaultCommandSet.commands[WearItemFactory.name] = new WearItemFactory(defaultCommandSet);
defaultCommandSet.commands[ErrorFactory.name] = new ErrorFactory(defaultCommandSet);

const socialCommandSet = new CommandSet('social');
socialCommandSet.commands[SayFactory.name] = new SayFactory(socialCommandSet);
socialCommandSet.commands[ShoutFactory.name] = new ShoutFactory(socialCommandSet);

const fighterCommandSet = new CommandSet('fighter');
fighterCommandSet.commands[KickFactory.name] = new KickFactory(fighterCommandSet);

const priestCommandSet = new CommandSet('priest');
priestCommandSet.commands[ChantFactory.name] = new ChantFactory(priestCommandSet);

const adminCommandSet = new CommandSet('admin');
adminCommandSet.commands[KillFactory.name] = new KillFactory(adminCommandSet);

export {
  /** The default command set **/
  defaultCommandSet as DefaultCommandSet,
  socialCommandSet as SocialCommandSet,
  fighterCommandSet as FighterCommandSet,
  priestCommandSet as PriestCommandSet,
  adminCommandSet as AdminCommandSet,
};
