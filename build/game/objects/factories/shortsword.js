//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import WeaponModel from '../../../db/models/WeaponModel.js';
import Weapon from '../Weapon.js';
/**
 * @module game/objects/factories/shortsword
 */
/**
 * Create a new shortsword
 *
 * @returns {Weapon}
 */
const shortswordFactory = () => __awaiter(void 0, void 0, void 0, function* () {
    const model = new WeaponModel();
    model.name = 'shortsword';
    model.description = 'A light one-handed sword used for thrusting.';
    model.properties.push('light');
    model.properties.push('finesse');
    model.damageType = 'piercing';
    model.weaponType = 'martial';
    model.wearableLocations.push('leftHand');
    model.wearableLocations.push('rightHand');
    model.classRestriction.push('fighter');
    model.classRestriction.push('rogue');
    model.weight = 2;
    model.minDamage = 1;
    model.maxDamage = 4;
    model.durability.current = 20;
    model.durability.base = 20;
    yield model.save();
    const weapon = new Weapon(model);
    yield weapon.load();
    return weapon;
});
export default shortswordFactory;
