//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import EventEmitter from 'events';
import assert from 'power-assert';

import Quest from '../../../../src/game/characters/quests/Quest.js';
import QuestState from '../../../../src/game/characters/quests/QuestState.js';
import QuestModel from '../../../../src/db/models/QuestModel.js';

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

  constructor(name) {
    super();
    this.id = name;
    this.name = name;
    this.characterRef = name;
    this.room = new MockRoom();
    this.factions = {
      adjustFaction: () => {},
    };
  }

  toShortText() {
    return this.name;
  }
}

describe('Quest', () => {

  let character;
  let model;
  let actor;

  beforeEach(async () => {
    character = new MockCharacter('character');
    actor = new MockCharacter('actor');
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

  describe('accept', () => {
    describe('when accepting a quest', () => {
      it('creates the state and starts tracking the character', async () => {
        const uut = new Quest(model, character);
        await uut.load();
        uut.accept(actor);
        assert(Object.keys(uut.characterProgress).length === 1);
        assert(uut.characterProgress[actor.id]._currentState === QuestState.STAGE_STATE.IN_PROGRESS);
        assert(character.room.messages[0].message.text === 'hello actor');
      });
    });

    describe('when two chars accept a quest', () => {
      it('tracks state for both of them', async () => {
        const actor2 = new MockCharacter('actor2');
        const uut = new Quest(model, character);
        await uut.load();
        uut.accept(actor);
        uut.accept(actor2);
        assert(Object.keys(uut.characterProgress).length === 2);
        assert(uut.characterProgress[actor.id]._currentState === QuestState.STAGE_STATE.IN_PROGRESS);
        assert(uut.characterProgress[actor2.id]._currentState === QuestState.STAGE_STATE.IN_PROGRESS);
        assert(character.room.messages[0].message.text === 'hello actor');
        assert(character.room.messages[1].message.text === 'hello actor2');
      });
    });

    describe('when calling accept multiple times', () => {
      it('does not remove the old state', async () => {
        const uut = new Quest(model, character);
        await uut.load();
        uut.accept(actor);
        uut.characterProgress[actor.id]._currentState = QuestState.STAGE_STATE.COMPLETE;
        uut.accept(actor);
        assert(uut.characterProgress[actor.id]._currentState === QuestState.STAGE_STATE.COMPLETE);
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
        actor.emit('kill', actor, new MockCharacter('testy'));
        uut.complete(actor);
        assert(character.room.messages.length === 1);
        assert(character.room.messages[0].message.text === 'hello actor');
        assert(uut.characterProgress[actor.id]._currentState === QuestState.STAGE_STATE.NOT_STARTED);
      });
    });

    describe('when all stages are complete', () => {
      it('completes the quest', async () => {
        const uut = new Quest(model, character);
        await uut.load();
        uut.accept(actor);
        actor.emit('kill', actor, new MockCharacter('testy'));
        uut.complete(actor);
        uut.accept(actor);
        actor.emit('kill', actor, new MockCharacter('testy'));
        uut.complete(actor);
        actor.emit('kill', actor, new MockCharacter('testy'));
        uut.complete(actor);
        assert(character.room.messages.length === 3);
        assert(character.room.messages[0].message.text === 'hello actor');
        assert(character.room.messages[1].message.text === 'Oh hello actor');
        assert(character.room.messages[2].message.text === 'Neat actor');
        assert(uut.characterProgress[actor.id]._currentState === QuestState.STAGE_STATE.NOT_STARTED);
      });
    });
  });

  describe('load', () => {
    it('loads in and creates the stages', async () => {
      const uut = new Quest(model, character);
      await uut.load();
      assert(uut.stages.length === 2);
    });

  });

  describe('save', () => {

  });

});