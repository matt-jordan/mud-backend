//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';
import Conversation from '../../../../build/game/characters/helpers/Conversation.js';
import FactionManager from '../../../../build/game/characters/helpers/FactionManager.js';
import ConversationModel from '../../../../build/db/models/ConversationModel.js';

class MockRoom {

  constructor(speaker) {
    this.speaker = speaker;
    this.combatManager = {
      getCombat: () => { return null; },
    };
    this.characters = {
      all: {
        find: (cb) => {
          if (cb(this.speaker)) {
            return this.speaker;
          }
          return null;
        }
      }
    };
  }
}

class MockConversationCharacter {

  constructor(name) {
    this.id = name;
    this.name = name;
    this.messages = [];
    this.factions = new FactionManager(this);
    this.room = {
      combatManager: {
        getCombat: () => { return null; },
      },
      sendImmediate: (sender, message) => {
        this.messages.push({ sender, message });
      }
    };
  }

  toShortText() {
    return this.name;
  }
}

describe('Conversation', () => {

  let model;
  let character;
  let speaker1;
  let speaker2;

  beforeEach(() => {
    character = new MockConversationCharacter('Test McTestFace');
    speaker1 = new MockConversationCharacter('speaker1');
    speaker2 = new MockConversationCharacter('speaker2');
  });

  afterEach(async () => {
    await ConversationModel.deleteMany();
  });

  describe('onSay', () => {
    beforeEach(async () => {
      model = new ConversationModel();
      model.onSay = {
        state: 'initial',
      };
      model.states = [
        {
          name: 'initial',
          text: 'The initial state',
          transitions: [
            {
              triggerText: 'initial',
              state: 'initial',
            },
            {
              triggerText: 'state1',
              state: 'state1',
            }
          ]
        },
        {
          name: 'state1',
          text: 'The first transitioned state',
          transitions: [
            {
              triggerText: 'state2',
              state: 'state2'
            },
          ]
        },
        {
          name: 'state2',
          text: 'The second transitioned state',
          transitions: [
            {
              triggerText: 'terminal',
              state: 'terminal'
            },
            {
              triggerText: 'loop',
              state: 'initial'
            }
          ]
        },
        {
          name: 'terminal',
          text: 'Terminal state with no transitions'
        }
      ];
      await model.save();
    });

    describe('when there is no speaker', () => {
      describe('empty list', () => {
        it('stays on the same state and does not emit anything', async () => {
          const uut = new Conversation(model, character);
          await uut.onSay({ message: { socialType: 'say' }, senders: [] }, 'state1', new MockRoom(null));
          assert(Object.keys(uut.conversationState).length === 0);
        });
      });

      describe('not in room', () => {
        it('stays on the same state and does not emit anything', async () => {
          const uut = new Conversation(model, character);
          await uut.onSay({ message: { socialType: 'say' }, senders: [speaker1.id] }, 'state1', new MockRoom(speaker2));
          assert(Object.keys(uut.conversationState).length === 0);
        });
      });
    });

    describe('speakers', () => {
      it('maintains a conversation for each speaker', async () => {
        const uut = new Conversation(model, character);
        await uut.onSay({ message: { socialType: 'say' }, senders: [speaker1.id] }, 'blah', new MockRoom(speaker1));
        assert(Object.keys(uut.conversationState).length === 1);
        await uut.onSay({ message: { socialType: 'say' }, senders: [speaker2.id] }, 'more blah', new MockRoom(speaker2));
        assert(Object.keys(uut.conversationState).length === 2);
      });
    });

    describe('transitions', () => {
      describe('keyword match', () => {
        it('responds to the right speaker', async () => {
          const uut = new Conversation(model, character);
          await uut.onSay({ message: { socialType: 'say' }, senders: [speaker1.id] }, 'blah', new MockRoom(speaker1));
          await uut.onSay({ message: { socialType: 'say' }, senders: [speaker2.id] }, 'blah', new MockRoom(speaker2));
          await uut.onSay({ message: { socialType: 'say' }, senders: [speaker1.id] }, 'state1', new MockRoom(speaker1));
          assert(uut.conversationState[speaker1.id]);
          assert(uut.conversationState[speaker1.id].currentState.id === 'state1');
          assert(uut.conversationState[speaker2.id]);
          assert(uut.conversationState[speaker2.id].currentState.id === 'initial');
          assert(character.messages.length === 1);
        });

        describe('circular transition', () => {
          it('moves to the new state', async () => {
            const uut = new Conversation(model, character);
            await uut.onSay({ message: { socialType: 'say' }, senders: [speaker1.id] }, 'state1', new MockRoom(speaker1));
            await uut.onSay({ message: { socialType: 'say' }, senders: [speaker1.id] }, 'state2', new MockRoom(speaker1));
            await uut.onSay({ message: { socialType: 'say' }, senders: [speaker1.id] }, 'loop', new MockRoom(speaker1));
            assert(uut.conversationState[speaker1.id]);
            assert(uut.conversationState[speaker1.id].currentState.id === 'initial');
            assert(character.messages.length === 3);
          });
        });

        describe('terminal state', () => {
          it('stops moving', async () => {
            const uut = new Conversation(model, character);
            await uut.onSay({ message: { socialType: 'say' }, senders: [speaker1.id] }, 'state1', new MockRoom(speaker1));
            await uut.onSay({ message: { socialType: 'say' }, senders: [speaker1.id] }, 'state2', new MockRoom(speaker1));
            await uut.onSay({ message: { socialType: 'say' }, senders: [speaker1.id] }, 'terminal', new MockRoom(speaker1));
            await uut.onSay({ message: { socialType: 'say' }, senders: [speaker1.id] }, 'state1', new MockRoom(speaker1));
            await uut.onSay({ message: { socialType: 'say' }, senders: [speaker1.id] }, 'state2', new MockRoom(speaker1));
            assert(uut.conversationState[speaker1.id]);
            assert(uut.conversationState[speaker1.id].currentState.id === 'terminal');
            assert(character.messages.length === 3);
          });
        });
      });

      describe('no match', () => {
        it('stays on the same state', async () => {
          const uut = new Conversation(model, character);
          await uut.onSay({ message: { socialType: 'say' }, senders: [speaker1.id] }, 'state1', new MockRoom(speaker1));
          await uut.onSay({ message: { socialType: 'say' }, senders: [speaker1.id] }, 'state2', new MockRoom(speaker1));
          await uut.onSay({ message: { socialType: 'say' }, senders: [speaker1.id] }, 'foo', new MockRoom(speaker1));
          assert(uut.conversationState[speaker1.id]);
          assert(uut.conversationState[speaker1.id].currentState.id === 'state2');
          assert(character.messages.length === 2);
        });
      });
    });

    describe('substitutions', () => {
      describe('{{character}}', () => {
        beforeEach(async () => {
          model.states[0].text = '{{character}} hello there';
          await model.save();
        });

        it('replaces with the speakers name', async () => {
          const uut = new Conversation(model, character);
          await uut.onSay({ message: { socialType: 'say' }, senders: [speaker1.id] }, 'initial', new MockRoom(speaker1));
          assert(uut.conversationState[speaker1.id]);
          assert(character.messages.length === 1);
          assert(character.messages[0].message.text === 'speaker1 hello there',
            `${character.messages[0].message.text}`);
        });
      });
    });

    describe('text triggers', () => {
      describe('pre', () => {
        describe('normal text', () => {
          beforeEach(async () => {
            model.states[0].textTriggers = [];
            model.states[0].textTriggers.push({
              text: 'Testy',
              textLocation: 'pre',
              textId: 'trigger1',
            });
            await model.save();
          });

          it('puts the text in the right location', async () => {
            const uut = new Conversation(model, character);
            await uut.onSay({ message: { socialType: 'say' }, senders: [speaker1.id] }, 'initial', new MockRoom(speaker1));
            assert(uut.conversationState[speaker1.id]);
            assert(character.messages.length === 1);
            assert(character.messages[0].message.text === 'Testy The initial state',
              `${character.messages[0].message.text}`);
          });
        });

        describe('multiple triggers', () => {
          beforeEach(async () => {
            model.states[0].textTriggers = [];
            model.states[0].textTriggers.push({
              text: 'Testy1',
              textLocation: 'pre',
              textId: 'trigger1',
            });
            model.states[0].textTriggers.push({
              text: 'Testy2',
              textLocation: 'pre',
              textId: 'trigger2',
            });
            await model.save();
          });

          it('puts the text in the right location', async () => {
            const uut = new Conversation(model, character);
            await uut.onSay({ message: { socialType: 'say' }, senders: [speaker1.id] }, 'initial', new MockRoom(speaker1));
            assert(uut.conversationState[speaker1.id]);
            assert(character.messages.length === 1);
            assert(character.messages[0].message.text === 'Testy2 Testy1 The initial state',
              `${character.messages[0].message.text}`);
          });
        });

        describe('substitutions', () => {
          describe('{{character}}', () => {
            beforeEach(async () => {
              model.states[0].textTriggers = [];
              model.states[0].textTriggers.push({
                text: '{{character}}',
                textLocation: 'pre',
                textId: 'trigger1',
              });
              await model.save();
            });

            it('puts the text in the right location', async () => {
              const uut = new Conversation(model, character);
              await uut.onSay({ message: { socialType: 'say' }, senders: [speaker1.id] }, 'initial', new MockRoom(speaker1));
              assert(uut.conversationState[speaker1.id]);
              assert(character.messages.length === 1);
              assert(character.messages[0].message.text === 'speaker1 The initial state',
                `${character.messages[0].message.text}`);
            });
          });
        });
      });

      describe('visits', () => {
        describe('first visit', () => {
          beforeEach(async () => {
            model.states[0].textTriggers = [];
            model.states[0].textTriggers.push({
              text: 'Testy',
              textLocation: 'pre',
              triggerType: 'visits',
              triggerData: '0',
              textId: 'trigger1',
            });
            await model.save();
          });

          it('displays the right text on the first visit', async () => {
            const uut = new Conversation(model, character);
            await uut.onSay({ message: { socialType: 'say' }, senders: [speaker1.id] }, 'initial', new MockRoom(speaker1));
            assert(uut.conversationState[speaker1.id]);
            assert(character.messages.length === 1);
            assert(character.messages[0].message.text === 'Testy The initial state',
              `${character.messages[0].message.text}`);
          });

          it('does not display the text again after the first visit', async () => {
            const uut = new Conversation(model, character);
            await uut.onSay({ message: { socialType: 'say' }, senders: [speaker1.id] }, 'initial', new MockRoom(speaker1));
            await uut.onSay({ message: { socialType: 'say' }, senders: [speaker1.id] }, 'initial', new MockRoom(speaker1));
            assert(uut.conversationState[speaker1.id]);
            assert(character.messages.length === 2);
            assert(character.messages[0].message.text === 'Testy The initial state',
              `${character.messages[0].message.text}`);
            assert(character.messages[1].message.text === 'The initial state',
              `${character.messages[1].message.text}`);
          });
        });

        describe('later visits', () => {
          beforeEach(async () => {
            model.states[0].textTriggers = [];
            model.states[0].textTriggers.push({
              text: 'Testy',
              textLocation: 'pre',
              triggerType: 'visits',
              triggerData: '>0',
              textId: 'trigger1',
            });
            await model.save();
          });

          it('displays the right text on later visits', async () => {
            const uut = new Conversation(model, character);
            await uut.onSay({ message: { socialType: 'say' }, senders: [speaker1.id] }, 'initial', new MockRoom(speaker1));
            await uut.onSay({ message: { socialType: 'say' }, senders: [speaker1.id] }, 'initial', new MockRoom(speaker1));
            assert(uut.conversationState[speaker1.id]);
            assert(character.messages.length === 2);
            assert(character.messages[0].message.text === 'The initial state',
              `${character.messages[0].message.text}`);
            assert(character.messages[1].message.text === 'Testy The initial state',
              `${character.messages[1].message.text}`);
          });
        });
      });
    });
  });

  describe('load', () => {
    describe('when there is no character data', () => {
      beforeEach(async () => {
        model = new ConversationModel();
        await model.save();
      });

      it('loads successfully', async () => {
        const uut = new Conversation(model, { id: 'id', name: 'name' });
        assert(uut);
        await uut.load();
        assert(Object.keys(uut.conversationState).length === 0);
      });
    });

    describe('when there is character data', () => {
      beforeEach(async () => {
        model = new ConversationModel();
        model.onSay = {
          state: 'start',
        };
        model.states = [
          {
            name: 'start',
            text: 'start',
          },
          {
            name: 'foo',
            text: 'foo',
          }
        ];
        model.characterData = [
          {
            characterId: 'id-1',
          },
          {
            characterId: 'id-2',
            lastState: 'foo',
            visits: 300,
          },
        ];
        await model.save();
      });

      it('loads successfully', async () => {
        const uut = new Conversation(model, character);
        assert(uut);
        await uut.load();
        assert(Object.keys(uut.conversationState).length === 2);
        assert(uut.conversationState['id-1']);
        assert(uut.conversationState['id-1'].currentState.id === 'start');
        assert(uut.conversationState['id-1'].currentState.visits === 0);
        assert(uut.conversationState['id-2']);
        assert(uut.conversationState['id-2'].currentState.id === 'foo');
        assert(uut.conversationState['id-2'].currentState.visits === 300);
      });
    });
  });

  describe('save', () => {
    let model;

    beforeEach(async () => {
      model = new ConversationModel();
      model.onSay = {
        state: 'start',
      };
      model.states = [
        {
          name: 'start',
          text: 'start',
        },
        {
          name: 'foo',
          text: 'foo',
        }
      ];
      model.characterData = [
        {
          characterId: 'id-1',
        },
        {
          characterId: 'id-2',
          lastState: 'foo',
          visits: 300,
        },
      ];
      await model.save();
    });

    it('saves character data successfully', async () => {
      const uut = new Conversation(model, character);
      assert(uut);
      await uut.load();
      uut.conversationState['id-1'].currentState.visits = 100;
      uut.conversationState['id-1'].currentState = uut.conversationState['id-1'].states['foo'];
      uut.conversationState['id-2'].currentState.visits = 301;
      await uut.save();
      const results = await ConversationModel.findById(model._id);
      assert(results);
      assert(results.characterData.length === 2);
      assert(results.characterData[0].characterId === 'id-1');
      assert(results.characterData[0].lastState === 'foo');
      assert(results.characterData[0].visits === 100);
      assert(results.characterData[1].characterId === 'id-2');
      assert(results.characterData[1].lastState === 'foo');
      assert(results.characterData[1].visits === 301);
    });
  });
});
