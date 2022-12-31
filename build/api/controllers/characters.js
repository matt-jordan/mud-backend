"use strict";
//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const CharacterModel_js_1 = __importDefault(require("../../db/models/CharacterModel.js"));
const AccountModel_js_1 = __importDefault(require("../../db/models/AccountModel.js"));
const errors_js_1 = require("../../lib/errors.js");
const router = (0, express_1.Router)();
router.get('/:characterId', async (req, res, next) => {
    const characterId = req.params.characterId;
    if (characterId.length !== 24) {
        return next(new errors_js_1.BadRequestError('Invalid characterId'));
    }
    const character = await CharacterModel_js_1.default.findById(characterId).exec();
    if (!character) {
        return next(new errors_js_1.NotFoundError('Character not found'));
    }
    return res.status(200).json(character.toObject());
});
/**
 * {
 *    accountName: String
 *    name: String
 *    description: String
 *    age: Integer
 *    gender: String (male, female, non-binary)
 *    attributes: {
 *      strength: Integer
 *      dexterity: Integer
 *      constitution: Integer
 *      wisdom: Integer
 *      intelligence: Integer
 *      charisma: Integer
 *    },
 *    class: String (fighter, priest, rogue, mage)
 * }
 */
router.post('/', async (req, res, next) => {
    const { accountName, name, description = '', age = 25, gender = 'male', class: characterClass = 'fighter', attributes: { strength = 10, dexterity = 10, constitution = 10, wisdom = 10, intelligence = 10, charisma = 10, } = {}, } = req.body;
    if (!accountName) {
        return next(new errors_js_1.BadRequestError('An accountName is required'));
    }
    if (!name) {
        return next(new errors_js_1.BadRequestError('A name is required'));
    }
    const existingAccount = await AccountModel_js_1.default.findOne({ accountName }).exec();
    if (!existingAccount) {
        return next(new errors_js_1.BadRequestError(`Account ${accountName} does not exist`));
    }
    if (!['female', 'male', 'non-binary'].includes(gender)) {
        return next(new errors_js_1.BadRequestError('Invalid gender'));
    }
    if (!['fighter', 'priest', 'mage', 'rogue'].includes(characterClass)) {
        return next(new errors_js_1.BadRequestError('Invalid character class'));
    }
    const character = new CharacterModel_js_1.default();
    character.name = name;
    character.accountId = existingAccount._id;
    character.description = description;
    character.age = age;
    character.gender = gender;
    character.attributes = {};
    character.attributes.strength = { base: strength };
    character.attributes.dexterity = { base: dexterity };
    character.attributes.constitution = { base: constitution };
    character.attributes.wisdom = { base: wisdom };
    character.attributes.intelligence = { base: intelligence };
    character.attributes.charisma = { base: charisma };
    character.classes = [];
    character.classes.push({
        type: characterClass,
        level: 1,
        experience: 0
    });
    // TODO: Move this to some game logic someplace
    let manapoints, hitpoints, energypoints;
    switch (characterClass) {
        case 'fighter':
            energypoints = 120; // D12 * 10
            hitpoints = 12; // D12
            manapoints = 0;
            break;
        case 'priest':
            energypoints = 80; // D8 * 10
            hitpoints = 8; // D8
            manapoints = 12 + (wisdom - 10) / 2; // D4 * 3
            break;
        case 'rogue':
            energypoints = 80; // D8 * 10
            hitpoints = 8; // D8
            manapoints = 0;
            break;
        case 'mage':
            energypoints = 60; // D6 * 10
            hitpoints = 6; // D6
            manapoints = 30 + (intelligence - 10) / 2; // D10 * 3
            break;
    }
    energypoints = energypoints + (constitution - 10) / 2;
    hitpoints = hitpoints + (constitution - 10) / 2;
    character.attributes.hitpoints = { base: hitpoints, current: hitpoints };
    character.attributes.manapoints = { base: manapoints, current: manapoints };
    character.attributes.energypoints = { base: energypoints, current: energypoints };
    await character.save();
    existingAccount.characterIds.push(character._id);
    await existingAccount.save();
    res.status(201).json(character.toObject());
});
exports.default = router;
