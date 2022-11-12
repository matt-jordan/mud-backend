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
 * @module game/objects/factories/mace
 */
/**
 * Create a new mace
 *
 * @returns {Weapon}
 */
const maceFactory = () => __awaiter(void 0, void 0, void 0, function* () {
    const model = new WeaponModel();
    model.name = 'mace';
    model.description = 'A blunt weapon with a heavy head on the end of a metal handle.';
    model.damageType = 'bludgeoning';
    model.weaponType = 'simple';
    model.wearableLocations.push('leftHand');
    model.wearableLocations.push('rightHand');
    model.classRestriction.push('fighter');
    model.classRestriction.push('rogue');
    model.classRestriction.push('priest');
    model.weight = 4;
    model.minDamage = 1;
    model.maxDamage = 6;
    model.durability.current = 20;
    model.durability.base = 20;
    yield model.save();
    const weapon = new Weapon(model);
    yield weapon.load();
    return weapon;
});
export default maceFactory;
