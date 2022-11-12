//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import EventEmitter from 'events';
import assert from 'power-assert';

import Quest from '../../../../build/game/characters/quests/Quest.js';
import QuestState from '../../../../build/game/characters/quests/QuestState.js';
import QuestModel from '../../../../build/db/models/QuestModel.js';

class MockRoom {
  constructor(character) {
    this.character = character;
    this.messages = [];
  }

  sendImmediate(sender, message) {
    this.messages.push({ sender, message });
  }
}

class MockCharacter extends EventEmitter {

  constructor(name, id) {
    super();
    this.id = id;
    this.name = name;
    this.characterRef = name;
    this.questsCompleted = [];
    this.room = new MockRoom();
    this.world = {
      characters: []
    };
    this.factions = {
      adjustFaction: () => {},
    };
    this.currencies = {
      deposit: () => {},
    };
  }

  getLevel() {
    return 1;
  }

  toShortText() {
    return this.name;
  }

  sendImmediate() {}
}

describe('Quest', () => {

  let character;
  let model;
  let actor;

  beforeEach(async () => {
    character = new MockCharacter('character', '61f0e305cc78a1eec321adda');
    actor = new MockCharacter('actor', '61f0e305cc78a1eec321addf');
    character.world.characters.push(character);
    character.world.characters.push(actor);

    model = new QuestModel();
    model.name = 'Test Quest';
    model.stages = [
      {
        onAccept: { text: 'hello {{character}}' },
        questType: 'assassination',
        questData: {
          targets: [{ characterRef: 'testy', count: 1 }],
        },
        rewards: [
          {
            rewardType: 'currency',
            data: {
              quantity: 50,
              name: 'gold',
            },
          },
          {
            rewardType: 'faction',
            data: {
              faction: 'test',
              bonus: 100,
            },
          },
        ],
      },
      {
        onStatusCheck: { text: 'Oh hello {{character}}' },
        onCompletion: { text: 'Neat {{character}}' },
        questType: 'assassination',
        questData: {
          targets: [{ characterRef: 'testy', count: 2 }],
        },
      }
    ];
    await model.save();
  });

  afterEach(async () => {
    await QuestModel.deleteMany();
  });

  describe('characterCheck', () => {
    describe('when there are no restrictions', () => {
      it('returns true', async () => {
        const uut = new Quest(model, character);
        await uut.load();
        assert(uut.characterCheck(actor) === true);
      });
    });

    describe('when the restrictions return false', () => {
      beforeEach(async () => {
        model.restrictions = [];
        model.restrictions.push({ restrictionType: 'level', data: { minLevel: 2 }});
        await model.save();
      });

      it('returns false', async () => {
        const uut = new Quest(model, character);
        await uut.load();
        assert(uut.characterCheck(actor) === false);
      });
    });

    describe('when the restrictions return true', () => {
      beforeEach(async () => {
        model.restrictions = [];
        model.restrictions.push({ restrictionType: 'level', data: { minLevel: 1 }});
        await model.save();
      });

      it('returns false', async () => {
        const uut = new Quest(model, character);
        await uut.load();
        assert(uut.characterCheck(actor) === true);
      });
    });
  });

  describe('accept', () => {
    describe('when accepting a quest', () => {
      it('creates the state and starts tracking the character', async () => {
        const uut = new Quest(model, character);
        await uut.load();
        uut.accept(actor);
        assert(Object.keys(uut.characterProgress).length === 1);
        assert(uut.characterProgress[actor.id].stageState === QuestState.STAGE_STATE.IN_PROGRESS);
        assert(character.room.messages[0].message.text === 'hello actor');
      });
    });

    describe('when two chars accept a quest', () => {
      it('tracks state for both of them', async () => {
        const actor2 = new MockCharacter('actor2', '61f0e305cc78a1eec321add0');
        character.world.characters.push(actor2);
        const uut = new Quest(model, character);
        await uut.load();
        uut.accept(actor);
        uut.accept(actor2);
        assert(Object.keys(uut.characterProgress).length === 2);
        assert(uut.characterProgress[actor.id].stageState === QuestState.STAGE_STATE.IN_PROGRESS);
        assert(uut.characterProgress[actor2.id].stageState === QuestState.STAGE_STATE.IN_PROGRESS);
        assert(character.room.messages[0].message.text === 'hello actor');
        assert(character.room.messages[1].message.text === 'hello actor2');
      });
    });

    describe('when calling accept multiple times', () => {
      it('does not remove the old state', async () => {
        const uut = new Quest(model, character);
        await uut.load();
        uut.accept(actor);
        uut.characterProgress[actor.id].pendingCompleteStage();
        uut.accept(actor);
        assert(uut.characterProgress[actor.id].stageState === QuestState.STAGE_STATE.PENDING_COMPLETE);
      });
    });
  });

  describe('checkStatus', () => {
    describe('when the actor has not yet started the quest', () => {
      it('does nothing', async () => {
        const uut = new Quest(model, character);
        await uut.load();
        uut.checkStatus(actor);
        assert(character.room.messages.length === 0);
      });
    });

    describe('when the character has the quest in progress', () => {
      describe('and the stage/strategy do not have a special text', () => {
        it('does nothing', async () => {
          const uut = new Quest(model, character);
          await uut.load();
          uut.accept(actor);
          uut.checkStatus(actor);
          assert(character.room.messages.length === 1);
          assert(character.room.messages[0].message.text === 'hello actor');
        });
      });

      describe('and the stage has special text', () => {
        beforeEach(async () => {
          model.stages[0].onStatusCheck = { text: 'Oh hello {{character}}' };
          await model.save();
        });

        it('sends the message', async () => {
          const uut = new Quest(model, character);
          await uut.load();
          uut.accept(actor);
          uut.checkStatus(actor);
          assert(character.room.messages.length === 2);
          assert(character.room.messages[0].message.text === 'hello actor');
          assert(character.room.messages[1].message.text === 'Oh hello actor');
        });
      });
    });
  });

  describe('complete', () => {
    describe('when the actor is not doing the quest', () => {
      it('does nothing', async () => {
        const uut = new Quest(model, character);
        await uut.load();
        uut.complete(actor);
        assert(character.room.messages.length === 0);
      });
    });

    describe('when the actor has not yet completed the criteria', () => {
      beforeEach(async () => {
        model.stages[0].onStatusCheck = { text: 'Oh hello {{character}}' };
        await model.save();
      });

      it('does a check status', async () => {
        const uut = new Quest(model, character);
        await uut.load();
        uut.accept(actor);
        uut.complete(actor);
        assert(character.room.messages.length === 2);
        assert(character.room.messages[0].message.text === 'hello actor');
        assert(character.room.messages[1].message.text === 'Oh hello actor');
      });
    });

    describe('when the quest stage criteria is complete', () => {
      it('completes the stage', async () => {
        const uut = new Quest(model, character);
        await uut.load();
        uut.accept(actor);
        actor.emit('kill', actor, new MockCharacter('testy', '61f0e305cc78a1eec321add1'));
        uut.complete(actor);
        assert(character.room.messages.length === 1);
        assert(character.room.messages[0].message.text === 'hello actor');
        assert(uut.characterProgress[actor.id].stageState === QuestState.STAGE_STATE.NOT_STARTED);
      });
    });

    describe('when all stages are complete', () => {
      it('completes the quest', async () => {
        const uut = new Quest(model, character);
        await uut.load();
        uut.accept(actor);
        actor.emit('kill', actor, new MockCharacter('testy', '61f0e305cc78a1eec321add1'));
        uut.complete(actor);
        uut.accept(actor);
        actor.emit('kill', actor, new MockCharacter('testy', '61f0e305cc78a1eec321add2'));
        uut.complete(actor);
        actor.emit('kill', actor, new MockCharacter('testy', '61f0e305cc78a1eec321add3'));
        uut.complete(actor);
        assert(character.room.messages.length === 3);
        assert(character.room.messages[0].message.text === 'hello actor');
        assert(character.room.messages[1].message.text === 'Oh hello actor');
        assert(character.room.messages[2].message.text === 'Neat actor');
        assert(!uut.characterProgress[actor.id]);
      });
    });
  });

  describe('load', () => {
    it('loads in and creates the stages', async () => {
      const uut = new Quest(model, character);
      await uut.load();
      assert(uut.stages.length === 2);
    });

    describe('with active quests', () => {
      beforeEach(async () => {
        character.world.characters.push(actor);
        model.activeParticipants.push({
          characterId: actor.id,
          activeStageIndex: 1,
          activeStageState: 1,
          activeStageData: {
            kills: 1,
          },
        });
        await model.save();
      });

      it('loads character state back into memory', async () => {
        const uut = new Quest(model, character);
        await uut.load();
        assert(Object.keys(uut.characterProgress).length === 1);
        assert(uut.characterProgress[actor.id].stageIndex === 1);
        assert(uut.characterProgress[actor.id].stageState === 1);
        assert(uut.characterProgress[actor.id].actorQuestData.kills === 1);
      });
    });
  });

  describe('save', () => {
    describe('with active quests', () => {
      it('saves the quest states', async () => {
        const uut = new Quest(model, character);
        await uut.load();
        uut.accept(actor);
        await uut.save();
        const newModel = await QuestModel.findOne({ name: 'Test Quest' });
        assert(newModel);
        assert(newModel.activeParticipants.length === 1);
        assert(newModel.activeParticipants[0].characterId.toString() === actor.id);
        assert(newModel.activeParticipants[0].activeStageIndex === 0);
        assert(newModel.activeParticipants[0].activeStageState === 1);
      });
    });
  });

});