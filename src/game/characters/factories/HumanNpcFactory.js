//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import asyncForEach from '../../../lib/asyncForEach.js';
import randomInteger from '../../../lib/randomInteger.js';
import CharacterModel from '../../../db/models/CharacterModel.js';
import ConversationModel from '../../../db/models/ConversationModel.js';
import Character from '../../characters/Character.js';
import BaseClass from '../../classes/BaseClass.js';
import objectFactories from '../../objects/factories/index.js';
import Human from '../Human.js';

/**
 * @module game/characters/factories/HumanNpcFactory
 */

/**
 * Class that generates a human NPC
 */
class HumanNpcFactory {

  /**
   * Create a new HumanNpcFactory
   *
   * @param {World} world - The world we live in
   * @param {Room}  room  - The room to generate the Animal in
   */
  constructor(world, room) {
    this.room = room;
    this.world = world;
  }

  /**
   * Generate a new Human
   *
   * @returns {Human}
   */
  async generate(factoryData) {
    let props;

    if (factoryData && factoryData.humanNpc) {
      props = { ...factoryData.humanNpc };
    } else {
      props = {};
    }

    const model = new CharacterModel();
    model.name = props.name ?? 'human';
    model.characterRef = props.characterRef;
    model.description = props.description ?? 'A medium sized creature prone to great ambition.';
    model.age = props.age ?? randomInteger(18, 55);
    model.weight = props.weight ?? randomInteger(155, 235);
    model.roomId = this.room.id;
    model.gender = props.gender ?? (randomInteger(0, 1) === 0 ? 'male' : 'female');
    model.race = 'human';
    model.size = 'medium';
    model.attributes = {
      strength: { base: props.strength ?? 10 },
      dexterity: { base: props.dexterity ?? 10 },
      constitution: { base: props.constitution ?? 10 },
      intelligence: { base: props.intelligence ?? 10 },
      wisdom: { base: props.wisdom ?? 10 },
      charisma: { base: props.charisma ?? 10 },
      hitpoints: { base: 6, current: 6 },
      manapoints: { base: 6, current: 6 },
      energypoints: { base: 100, current: 100 },
    };
    model.defaultAttacks = [
      { minDamage: 0, maxDamage: 2, damageType: 'bludgeoning', verbs: { firstPerson: 'punch', thirdPerson: 'punches' }}
    ];

    // This should get moved to a base class of some sort
    if (props.conversationLoadId) {
      const conversationModel = await ConversationModel.findByLoadId(props.conversationLoadId);
      model.conversationId = conversationModel._id;
    }

    if (props.classPackage) {
      model.classes = props.classPackage.map((classPackage) => {
        return {
          type: classPackage.class,
          level: classPackage.level,
          experience: BaseClass.characterLevels[classPackage.level],
        };
      });
    }

    await model.save();

    const human = new Human(model, this.world);
    await human.load();

    // We should think about moving this into something else at some point. Note
    // that we generate this after object creation as the object factories will
    // create both the equipment and the object, and we can just assign the object
    // to specific locations on the generated NPC
    if (props.equipment) {
      const equipment = props.equipment;

      await asyncForEach(Character.physicalLocations, async (location) => {
        if (equipment[location]) {
          const equipmentData = equipment[location];
          const factory = objectFactories(equipmentData.type);
          const item = await factory(equipmentData.data);
          human.physicalLocations[location].item = item;
        }
      });
    }

    // If we have character levels, this won't 'level up' the character. Process
    // the level changes.
    human.classes.forEach((characterClass) => {
      for (let i = 1; i <= characterClass.level; i++) {
        characterClass.setLevel(i);
      }
      characterClass.setMaxSkills();
    });

    return human;
  }
}

export default HumanNpcFactory;