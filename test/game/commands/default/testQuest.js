//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import QuestModel from '../../../../src/db/models/QuestModel.js';
import LevelQuestRestriction from '../../../../src/game/characters/quests/LevelQuestRestriction.js';
import HumanNpcFactory from '../../../../src/game/characters/factories/HumanNpcFactory.js';
import { FakeClient, createWorld, destroyWorld } from '../../fixtures.js';
import { QuestListAction, QuestStatusAction, QuestAcceptAction, QuestFactory } from '../../../../src/game/commands/default/Quest.js';

describe('QuestListAction', () => {
  let pc;
  let npc;
  let theWorld;

  beforeEach(async () => {
    const { pc1, world } = await createWorld();
    pc = pc1;
    theWorld = world;
    pc.transport = new FakeClient();
  });

  afterEach(async () => {
    await destroyWorld();
    await QuestModel.deleteMany();
  });

  describe('when there are no quest givers in the room', () => {
    beforeEach(async () => {
      const factory = new HumanNpcFactory(theWorld, pc.room);
      npc = await factory.generate();
    });

    it('tells the character that', async () => {
      const uut = new QuestListAction();
      await uut.execute(pc);
      assert(pc.transport.sentMessages.length === 1);
      assert.match(pc.transport.sentMessages[0], /There are no quest givers here/);
    });
  });

  describe('when there is a quest giver in the room', () => {
    describe('and they do not want to give the character the quest', () => {
      beforeEach(async () => {
        const questModel = new QuestModel();
        questModel.name = 'Test Quest';
        questModel.description = 'A test quest.';
        questModel.questGiver = 'test-character';
        questModel.restrictions = [{ restrictionType: 'level', data: { minLevel: 10 }}];
        questModel.stages = [
          {
            questType: 'assassination',
            questData: {
              targets: [{ characterRef: 'testy', count: 1 }],
            },
          },
        ];
        await questModel.save();

        const factory = new HumanNpcFactory(theWorld, pc.room);
        npc = await factory.generate({ humanNpc: { characterRef: 'test-character' }});
      });

      it('tells the character they get nothing', async () => {
        const uut = new QuestListAction();
        await uut.execute(pc);
        assert(pc.transport.sentMessages.length === 1);
        assert.match(pc.transport.sentMessages[0], /human has no quests for you/);
      });
    });

    describe('and they want to give the character the quest', () => {
      beforeEach(async () => {
        const questModel = new QuestModel();
        questModel.name = 'Test Quest';
        questModel.description = 'A test quest.';
        questModel.questGiver = 'test-character';
        questModel.stages = [
          {
            questType: 'assassination',
            questData: {
              targets: [{ characterRef: 'testy', count: 1 }],
            },
          },
        ];
        await questModel.save();

        const factory = new HumanNpcFactory(theWorld, pc.room);
        npc = await factory.generate({ humanNpc: { characterRef: 'test-character' }});
      });

      it('tells the character about the quests', async () => {
        const uut = new QuestListAction();
        await uut.execute(pc);
        assert(pc.transport.sentMessages.length === 1);
        assert.match(pc.transport.sentMessages[0], /human has the follow quests for you/);
        assert.match(pc.transport.sentMessages[0], /A test quest/);
      });
    });
  });
});

describe('QuestAcceptAction', () => {
  let pc;
  let npc;
  let theWorld;

  beforeEach(async () => {
    const { pc1, world } = await createWorld();
    pc = pc1;
    theWorld = world;
    pc.transport = new FakeClient();
  });

  afterEach(async () => {
    await destroyWorld();
    await QuestModel.deleteMany();
  });

  describe('when there are no quest givers in the room', () => {
    it('tells the player that they cannot accept a quest', async () => {
      const uut = new QuestAcceptAction({ quest: 'wat' });
      await uut.execute(pc);
      assert(pc.transport.sentMessages.length === 1);
      assert.match(pc.transport.sentMessages[0], /There are no quest givers here/);
    });
  });

  describe('when there is a quest giver in the room', () => {
    let questModel;

    beforeEach(async () => {
      questModel = new QuestModel();
      questModel.name = 'Test Quest';
      questModel.description = 'A test quest.';
      questModel.questGiver = 'test-character';
      questModel.stages = [
        {
          onAccept: { text: 'huzzah' },
          questType: 'assassination',
          questData: {
            targets: [{ characterRef: 'testy', count: 1 }],
          },
        },
      ];
      await questModel.save();

      const factory = new HumanNpcFactory(theWorld, pc.room);
      npc = await factory.generate({ humanNpc: { characterRef: 'test-character' }});
    });

    describe('when the quest the player wants to accept does not exist', () => {
      it('tells the player that', async () => {
        const uut = new QuestAcceptAction({ quest: 'wat' });
        await uut.execute(pc);
        assert(pc.transport.sentMessages.length === 1);
        assert.match(pc.transport.sentMessages[0], /No one here has a quest named 'wat' for you/);
      });
    });

    describe('when the player cannot take on the quest', () => {
      describe('because they should never have been offered it', () => {
        beforeEach(async () => {
          npc.questsGiven[0].restrictions.push(new LevelQuestRestriction({ data: { minLevel: 10 }}));
        });

        it('tells the player that', async () => {
          const uut = new QuestAcceptAction({ quest: 'Test Quest' });
          await uut.execute(pc);
          assert(pc.transport.sentMessages.some(m => m.includes('human refuses to give you \'Test Quest\'')));
        });
      });

      describe('because they are on the quest already', () => {
        beforeEach(async () => {
          npc.questsGiven[0].accept(pc);
        });

        it('tells the player that', async () => {
          const uut = new QuestAcceptAction({ quest: 'Test Quest' });
          await uut.execute(pc);
          assert(pc.transport.sentMessages.some(m => m.includes('You are already on \'Test Quest\'')));
        });
      });
    });

    describe('when the player accepts a valid quest', () => {
      it('gives the quest to the player', async () => {
        const uut = new QuestAcceptAction({ quest: 'Test Quest' });
        await uut.execute(pc);
        assert(pc.transport.sentMessages.some(m => m.includes('You accept')));
      });
    });
  });
});

describe('QuestStatusAction', () => {
  let pc;
  let npc;
  let theWorld;

  beforeEach(async () => {
    const { pc1, world } = await createWorld();
    pc = pc1;
    theWorld = world;
    pc.transport = new FakeClient();
  });

  afterEach(async () => {
    await destroyWorld();
    await QuestModel.deleteMany();
  });

  describe('when you are not on a quest', () => {
    it('says so', async () => {
      const uut = new QuestStatusAction();
      await uut.execute(pc);
      assert(pc.transport.sentMessages.length === 1);
      assert.match(pc.transport.sentMessages[0], /You are not on any quests/);
    });
  });

  describe('when you are on a quest', () => {
    beforeEach(async () => {
      const questModel = new QuestModel();
      questModel.name = 'Test Quest';
      questModel.description = 'A test quest.';
      questModel.questGiver = 'test-character';
      questModel.stages = [
        {
          onAccept: { text: 'huzzah' },
          questType: 'assassination',
          questData: {
            targets: [{ characterRef: 'testy', count: 1, name: 'testies' }],
          },
        },
      ];
      await questModel.save();

      const factory = new HumanNpcFactory(theWorld, pc.room);
      npc = await factory.generate({ humanNpc: { characterRef: 'test-character' }});
      npc.questsGiven[0].accept(pc);
    });

    it('returns back the expected information', async () => {
      const uut = new QuestStatusAction();
      await uut.execute(pc);
      assert(pc.transport.sentMessages.length === 1);
      assert.match(pc.transport.sentMessages[0], /You are on the following quests:/);
    });
  });
});

describe('QuestFactory', () => {
  describe('when not enough information is provided', () => {
    it('returns an error', () => {
      const uut = new QuestFactory();
      const result = uut.generate([]);
      assert(result);
      assert(result.message === 'What do you want to know about quests?');
    });
  });

  describe('when there is no match for the sub-command', () => {
    it('returns an error', () => {
      const uut = new QuestFactory();
      const result = uut.generate(['wat']);
      assert(result);
      assert(result.message === 'Unknown quest command \'wat\': valid quest commands are \'list\', \'status\', and \'accept\'.', result.message);
    });
  });

  describe('when a list is asked for', () => {
    it('returns an error if there is too much information', () => {
      const uut = new QuestFactory();
      const result = uut.generate(['list', 'fooo']);
      assert(result);
      assert(result.message === '\'quest list\' does not take any other information.', result.message);
    });

    it('returns a list action', () => {
      const uut = new QuestFactory();
      const result = uut.generate(['list']);
      assert(result);
      assert(result instanceof QuestListAction);
    });
  });

  describe('when status is asked for', () => {
    it('returns an error if there is too much information', () => {
      const uut = new QuestFactory();
      const result = uut.generate(['status', 'fooo']);
      assert(result);
      assert(result.message === '\'quest status\' does not take any other information.', result.message);
    });

    it('returns a status action', () => {
      const uut = new QuestFactory();
      const result = uut.generate(['status']);
      assert(result);
      assert(result instanceof QuestStatusAction);
    });
  });

  describe('accept', () => {
    it('returns an error if no quest is specified', () => {
      const uut = new QuestFactory();
      const result = uut.generate(['accept']);
      assert(result);
      assert(result.message === 'You must specify what quest you want to accept.', result.message);
    });

    it('returns an accept action', () => {
      const uut = new QuestFactory();
      const result = uut.generate(['accept', 'foo']);
      assert(result);
      assert(result instanceof QuestAcceptAction);
      assert(result.quest === 'foo', result.quest);
    });
  });
});
