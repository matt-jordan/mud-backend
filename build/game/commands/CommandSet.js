"use strict";
//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminCommandSet = exports.PriestCommandSet = exports.FighterCommandSet = exports.SocialCommandSet = exports.DefaultCommandSet = void 0;
// Default commands
const Attack_js_1 = require("./default/Attack.js");
const Close_js_1 = require("./default/Close.js");
const DropItem_js_1 = require("./default/DropItem.js");
const Error_js_1 = require("./default/Error.js");
const Examine_js_1 = require("./default/Examine.js");
const GetItem_js_1 = require("./default/GetItem.js");
const Inventory_js_1 = require("./default/Inventory.js");
const Look_js_1 = require("./default/Look.js");
const Move_js_1 = require("./default/Move.js");
const Open_js_1 = require("./default/Open.js");
const PartyFactory_js_1 = require("./party/PartyFactory.js");
const PutItem_js_1 = require("./default/PutItem.js");
const Quest_js_1 = require("./default/Quest.js");
const RemoveItem_js_1 = require("./default/RemoveItem.js");
const Rest_js_1 = require("./default/Rest.js");
const Score_js_1 = require("./default/Score.js");
const Stand_js_1 = require("./default/Stand.js");
const WearItem_js_1 = require("./default/WearItem.js");
// Social commands
const Say_js_1 = require("./social/Say.js");
const Shout_js_1 = require("./social/Shout.js");
// Combat commands
const Kick_js_1 = require("./combat/Kick.js");
// Admin commands
const Kill_js_1 = require("./admin/Kill.js");
// Priest commands
const Chant_js_1 = require("./priest/Chant.js");
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
        this.errorFactory = new Error_js_1.ErrorFactory();
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
exports.DefaultCommandSet = defaultCommandSet;
defaultCommandSet.commands[Attack_js_1.AttackFactory.name] = new Attack_js_1.AttackFactory(defaultCommandSet);
defaultCommandSet.commands[Close_js_1.CloseFactory.name] = new Close_js_1.CloseFactory(defaultCommandSet);
defaultCommandSet.commands[DropItem_js_1.DropItemFactory.name] = new DropItem_js_1.DropItemFactory(defaultCommandSet);
defaultCommandSet.commands[Examine_js_1.ExamineFactory.name] = new Examine_js_1.ExamineFactory(defaultCommandSet);
defaultCommandSet.commands[GetItem_js_1.GetItemFactory.name] = new GetItem_js_1.GetItemFactory(defaultCommandSet);
defaultCommandSet.commands[Inventory_js_1.InventoryFactory.name] = new Inventory_js_1.InventoryFactory(defaultCommandSet);
defaultCommandSet.commands[Look_js_1.LookFactory.name] = new Look_js_1.LookFactory(defaultCommandSet);
defaultCommandSet.commands[Move_js_1.MoveFactory.name] = new Move_js_1.MoveFactory(defaultCommandSet);
defaultCommandSet.commands[Open_js_1.OpenFactory.name] = new Open_js_1.OpenFactory(defaultCommandSet);
defaultCommandSet.commands[PartyFactory_js_1.PartyFactory.name] = new PartyFactory_js_1.PartyFactory(defaultCommandSet);
defaultCommandSet.commands[PutItem_js_1.PutItemFactory.name] = new PutItem_js_1.PutItemFactory(defaultCommandSet);
defaultCommandSet.commands[Quest_js_1.QuestFactory.name] = new Quest_js_1.QuestFactory(defaultCommandSet);
defaultCommandSet.commands[RemoveItem_js_1.RemoveItemFactory.name] = new RemoveItem_js_1.RemoveItemFactory(defaultCommandSet);
defaultCommandSet.commands[Rest_js_1.RestFactory.name] = new Rest_js_1.RestFactory(defaultCommandSet);
defaultCommandSet.commands[Score_js_1.ScoreFactory.name] = new Score_js_1.ScoreFactory(defaultCommandSet);
defaultCommandSet.commands[Stand_js_1.StandFactory.name] = new Stand_js_1.StandFactory(defaultCommandSet);
defaultCommandSet.commands[WearItem_js_1.WearItemFactory.name] = new WearItem_js_1.WearItemFactory(defaultCommandSet);
defaultCommandSet.commands[Error_js_1.ErrorFactory.name] = new Error_js_1.ErrorFactory(defaultCommandSet);
const socialCommandSet = new CommandSet('social');
exports.SocialCommandSet = socialCommandSet;
socialCommandSet.commands[Say_js_1.SayFactory.name] = new Say_js_1.SayFactory(socialCommandSet);
socialCommandSet.commands[Shout_js_1.ShoutFactory.name] = new Shout_js_1.ShoutFactory(socialCommandSet);
const fighterCommandSet = new CommandSet('fighter');
exports.FighterCommandSet = fighterCommandSet;
fighterCommandSet.commands[Kick_js_1.KickFactory.name] = new Kick_js_1.KickFactory(fighterCommandSet);
const priestCommandSet = new CommandSet('priest');
exports.PriestCommandSet = priestCommandSet;
priestCommandSet.commands[Chant_js_1.ChantFactory.name] = new Chant_js_1.ChantFactory(priestCommandSet);
const adminCommandSet = new CommandSet('admin');
exports.AdminCommandSet = adminCommandSet;
adminCommandSet.commands[Kill_js_1.KillFactory.name] = new Kill_js_1.KillFactory(adminCommandSet);
