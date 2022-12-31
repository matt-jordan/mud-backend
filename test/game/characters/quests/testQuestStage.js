//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import QuestStage from '../../../../src/game/characters/quests/QuestStage.js';

class MockRoom {
  constructor(character) {
    this.character = character;
    this.messages = [];
  }

  sendImmediate(sender, message) {
    this.messages.push({ sender, message });
  }
}

class MockCharacter {

  constructor(name) {
    this.id = name;
    this.name = name;
    this.room = new MockRoom();
    this.world = {
      characters: [],
    };
  }

  toShortText() {
    return this.name;
  }
}

class MockStrategy {
  constructor() {
    this.acceptCalled = false;
    this.statusCheckCalled = false;
    this.completeCalled = false;
  }

  complete() {
    this.completeCalled = true;
  }

  accept() {
    this.acceptCalled = true;
  }

  checkStatus() {
    this.statusCheckCalled = true;
  }
}

class MockState {
  constructor() {
  }
}

describe('QuestStage', () => {
  let strategy;
  let character;
  let actor;

  beforeEach(() => {
    strategy = new MockStrategy();
    character = new MockCharacter('character');
    actor = new MockCharacter('actor');
    character.world.characters.push(character);
    character.world.characters.push(actor);
  });

  describe('accept', () => {
    describe('when the model does not care about accepting quests', () => {
      it('does nothing', () => {
        const uut = new QuestStage({}, strategy);
        uut.accept(character, actor.id, new MockState());
        assert(strategy.acceptCalled);
        assert(character.room.messages.length === 0);
      });
    });

    describe('when there is no text to send', () => {
      it('does nothing', () => {
        const uut = new QuestStage({ onAccept: {} }, strategy);
        uut.accept(character, actor.id, new MockState());
        assert(strategy.acceptCalled);
        assert(character.room.messages.length === 0);
      });
    });

    describe('when there is something to send', () => {
      it('sends the text message to the room', () => {
        const uut = new QuestStage({ onAccept: { text: 'Hello there' } }, strategy);
        uut.accept(character, actor.id, new MockState());
        assert(character.room.messages.length === 1);
        assert(strategy.acceptCalled);
        assert(character.room.messages[0].message.text === 'Hello there');
      });

      describe('transformations', () => {
        describe('{{character}}', () => {
          it('transforms the text', () => {
            const uut = new QuestStage({ onAccept: { text: 'Hello {{character}}' } }, strategy);
            uut.accept(character, actor.id, new MockState());
            assert(character.room.messages.length === 1);
            assert(strategy.acceptCalled);
            assert(character.room.messages[0].message.text === 'Hello actor');
          });
        });
      });
    });
  });

  describe('checkStatus', () => {
    describe('when the model does not care about checking quests', () => {
      it('does nothing', () => {
        const uut = new QuestStage({}, strategy);
        uut.checkStatus(character, actor.id, new MockState());
        assert(strategy.statusCheckCalled);
        assert(character.room.messages.length === 0);
      });
    });

    describe('when there is no text to send', () => {
      it('does nothing', () => {
        const uut = new QuestStage({ onAccept: {} }, strategy);
        uut.checkStatus(character, actor.id, new MockState());
        assert(strategy.statusCheckCalled);
        assert(character.room.messages.length === 0);
      });
    });

    describe('when there is something to send', () => {
      it('sends the text message to the room', () => {
        const uut = new QuestStage({ onStatusCheck: { text: 'Hello there' } }, strategy);
        uut.checkStatus(character, actor.id, new MockState());
        assert(character.room.messages.length === 1);
        assert(strategy.statusCheckCalled);
        assert(character.room.messages[0].message.text === 'Hello there');
      });

      describe('transformations', () => {
        describe('{{character}}', () => {
          it('transforms the text', () => {
            const uut = new QuestStage({ onStatusCheck: { text: 'Hello {{character}}' } }, strategy);
            uut.checkStatus(character, actor.id, new MockState());
            assert(character.room.messages.length === 1);
            assert(strategy.statusCheckCalled);
            assert(character.room.messages[0].message.text === 'Hello actor');
          });
        });
      });
    });
  });

  describe('complete', () => {
    describe('when the model does not care about completing quests', () => {
      it('does nothing', () => {
        const uut = new QuestStage({}, strategy);
        uut.complete(character, actor.id, new MockState());
        assert(strategy.completeCalled);
        assert(character.room.messages.length === 0);
      });
    });

    describe('when there is no text to send', () => {
      it('does nothing', () => {
        const uut = new QuestStage({ onAccept: {} }, strategy);
        uut.complete(character, actor.id, new MockState());
        assert(strategy.completeCalled);
        assert(character.room.messages.length === 0);
      });
    });

    describe('when there is something to send', () => {
      it('sends the text message to the room', () => {
        const uut = new QuestStage({ onCompletion: { text: 'Hello there' } }, strategy);
        uut.complete(character, actor.id, new MockState());
        assert(character.room.messages.length === 1);
        assert(strategy.completeCalled);
        assert(character.room.messages[0].message.text === 'Hello there');
      });

      describe('transformations', () => {
        describe('{{character}}', () => {
          it('transforms the text', () => {
            const uut = new QuestStage({ onCompletion: { text: 'Hello {{character}}' } }, strategy);
            uut.complete(character, actor.id, new MockState());
            assert(character.room.messages.length === 1);
            assert(strategy.completeCalled);
            assert(character.room.messages[0].message.text === 'Hello actor');
          });
        });
      });
    });

    describe('rewards', () => {
      it('invokes the rewards callback', () => {
        let rewardCalled = false;
        const uut = new QuestStage({}, strategy, [{ reward: () => { rewardCalled = true; }}]);
        uut.complete(character, actor.id, new MockState());
        assert(rewardCalled);
      });
    });
  });
});