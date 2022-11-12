//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------
import BaseClass from '../../classes/BaseClass.js';
/**
 * Get a very detailed description about a character
 *
 * @param {Character} character - The character being observed
 * @param {Character} observer  - The character doing the observing
 *
 * This will use two skill checks: observation (for the observer) and obfuscation
 * (for the character). Depending on the difficulty check associated with what
 * is being observed, the observer will see more (or less) of the character.
 *
 * While the difficulty check changes depending on the set of stats being
 * assessed, we only make a single roll for observation. Obfuscation is applied
 * as a flat penalty with the difficulty check.
 *
 * If character is the same as observer, this will recognize that we should output
 * a detailed description about 'ourselves', which will remove the difficulty
 * checks and provide a full accounting.
 *
 * @returns {String}
 */
function characterDetails(character, observer) {
    let observationResult = -1;
    let obfuscationResult = -1;
    let description = '';
    const pronounHelper = () => {
        if (character === observer) {
            return 'You';
        }
        return 'They';
    };
    const observationCheck = (dc) => {
        if (observer === character) {
            return true;
        }
        if (observationResult === -1) {
            observationResult = observer.skillCheck(observer.getSkill('observation'), 'wisdom');
        }
        if (obfuscationResult === -1) {
            obfuscationResult = character.getSkill('obfuscation');
        }
        return (observationResult >= dc + obfuscationResult);
    };
    const attributeScoreToDescription = (attribute) => {
        const score = character.attributes[attribute].current;
        let val;
        if (score <= 2) {
            val = 'staggeringly poor';
        }
        else if (score <= 4) {
            val = 'incredibly poor';
        }
        else if (score <= 7) {
            val = 'poor';
        }
        else if (score <= 9) {
            val = 'below average';
        }
        else if (score === 10) {
            val = 'average';
        }
        else if (score <= 12) {
            val = 'above average';
        }
        else if (score <= 14) {
            val = 'good';
        }
        else if (score <= 16) {
            val = 'incredibly good';
        }
        else if (score <= 20) {
            val = 'amazing';
        }
        else {
            val = 'god-like';
        }
        if (character === observer) {
            val += ` [${score}]`;
        }
        val += ` ${attribute}`;
        return val;
    };
    if (!observer) {
        observer = character;
    }
    let classes = '';
    if (character.classes.length !== 0) {
        classes = ` ${character.classes.map(c => {
            let post = '';
            let pre = '';
            if (character === observer) {
                pre = `L${c.level} `;
                post = ` [${c.experience}/${BaseClass.characterLevels[c.level + 1]}]`;
            }
            return `${pre}${c.characterType}${post}`;
        }).join(' / ')}`;
    }
    description += `\n${pronounHelper()} are a ${character.model.size} ${character.model.gender} `;
    description += `${character.model.race}${classes}`;
    if (observationCheck(125)) {
        description += `, weighing about ${character.model.weight} lbs`;
    }
    description += '.';
    if (observationCheck(25)) {
        const hitRatio = (character.attributes.hitpoints.current / character.attributes.hitpoints.base) * 100;
        description += ' ';
        if (hitRatio < 10) {
            description += `${pronounHelper()} are near death`;
        }
        else if (hitRatio < 25) {
            description += `${pronounHelper()} are badly wounded`;
        }
        else if (hitRatio < 50) {
            description += `${pronounHelper()} are wounded`;
        }
        else if (hitRatio < 75) {
            description += `${pronounHelper()} are injured`;
        }
        else if (hitRatio < 100) {
            description += `${pronounHelper()} are lightly injured`;
        }
        else {
            description += `${pronounHelper()} are uninjured`;
        }
        if (observer === character) {
            description += ` [${character.attributes.hitpoints.current}/${character.attributes.hitpoints.base}]`;
        }
        description += '.';
    }
    if (observationCheck(75)) {
        const energyRatio = (character.attributes.energypoints.current / character.attributes.energypoints.base) * 100;
        description += ' ';
        if (energyRatio < 10) {
            description += `${pronounHelper()} are about to collapse`;
        }
        else if (energyRatio < 25) {
            description += `${pronounHelper()} are exhausted`;
        }
        else if (energyRatio < 50) {
            description += `${pronounHelper()} are tired`;
        }
        else if (energyRatio < 75) {
            description += `${pronounHelper()} are winded`;
        }
        else if (energyRatio < 90) {
            description += `${pronounHelper()} are slightly winded`;
        }
        else {
            description += `${pronounHelper()} are full of energy`;
        }
        if (observer === character) {
            description += ` [${character.attributes.energypoints.current}/${character.attributes.energypoints.base}]`;
        }
        description += '.';
    }
    if (observationCheck(150)) {
        const manaRatio = (character.attributes.manapoints.current / character.attributes.manapoints.base) * 100;
        description += ' ';
        if (manaRatio < 10) {
            description += `${pronounHelper()} are dead to the energy of the universe`;
        }
        else if (manaRatio < 25) {
            description += `${pronounHelper()} can barely feel energy flows`;
        }
        else if (manaRatio < 50) {
            description += `${pronounHelper()} are feeling drained`;
        }
        else if (manaRatio < 75) {
            description += `${pronounHelper()} are starting to feel drained`;
        }
        else {
            description += `${pronounHelper()} are filled with the energy of the universe`;
        }
        if (observer === character) {
            description += ` [${character.attributes.manapoints.current}/${character.attributes.manapoints.base}]`;
        }
        description += '.';
    }
    if (observationCheck(105)) {
        description += `\n${pronounHelper()} have ${attributeScoreToDescription('strength')}, `;
        description += `${attributeScoreToDescription('dexterity')}, `;
        description += `${attributeScoreToDescription('constitution')}, `;
        description += `${attributeScoreToDescription('intelligence')}, `;
        description += `${attributeScoreToDescription('wisdom')}, `;
        description += `and ${attributeScoreToDescription('charisma')}.`;
    }
    if (observationCheck(200)) {
        description += `\n${pronounHelper()} are skilled in the following:\n`;
        const skills = [];
        character.skills.forEach((value, key) => {
            skills.push(`${key}: ${value}`);
        });
        const maxLength = Math.max(...skills.map(s => s.length));
        for (let i = 0; i < skills.length; i++) {
            description += skills[i].padStart(maxLength + 3, ' ');
            if ((i + 1) % 3 === 0) {
                description += '\n';
            }
        }
        description += '\n';
    }
    if (character.room) {
        const combat = character.room.combatManager.getCombat(character);
        if (combat) {
            const defender = combat.defender;
            if (defender === observer) {
                description += '\nThey are attacking you!';
            }
            else if (defender) {
                description += `\n${pronounHelper()} are attacking ${defender.toShortText()}!`;
            }
        }
    }
    return description;
}
export default characterDetails;
