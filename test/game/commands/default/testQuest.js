//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import QuestModel from '../../../../src/db/models/QuestModel.js';
import QuestState from '../../../../src/game/characters/quests/QuestState.js';
import LevelQuestRestriction from '../../../../src/game/characters/quests/LevelQuestRestriction.js';
import HumanNpcFactory from '../../../../src/game/characters/factories/HumanNpcFactory.js';
import { FakeClient, createWorld, destroyWorld } from '../../fixtures.js';
import {
  QuestListAction,
  QuestStatusAction,
  QuestAcceptAction,
  QuestCompleteAction,
  QuestFactory,
} from '../../../../src/game/commands/default/Quest.js';

describe('QuestListAction', () => {
  let pc;
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
      await factory.generate();
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
        await factory.generate({ humanNpc: { characterRef: 'test-character' }});
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
        await factory.generate({ humanNpc: { characterRef: 'test-character' }});
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

describe('QuestCompleteAction', () => {
  let pc;
  let npc1;
  let npc2;
  let theWorld;
  let rooms;

  beforeEach(async () => {
    const results = await createWorld();
    pc = results.pc1;
    theWorld = results.world;
    rooms = results.rooms;
    pc.transport = new FakeClient();
  });

  afterEach(async () => {
    await destroyWorld();
    await QuestModel.deleteMany();
  });

  beforeEach(async () => {
    const questModel1 = new QuestModel();
    questModel1.name = 'Test Quest1';
    questModel1.description = 'A test quest.';
    questModel1.questGiver = 'test-character1';
    questModel1.stages = [
      {
        onCompletion: { text: 'You have completed quest 1' },
        onStatusCheck: { text: 'You are on the quest still!' },
        questType: 'assassination',
        questData: {
          targets: [{ characterRef: 'testy', count: 1, name: 'testies' }],
        },
      },
    ];
    await questModel1.save();

    const questModel2 = new QuestModel();
    questModel2.name = 'Test Quest2';
    questModel2.description = 'A test quest.';
    questModel2.questGiver = 'test-character2';
    questModel2.stages = [
      {
        onCompletion: { text: 'You have completed quest 2' },
        onStatusCheck: { text: 'You are on the quest still!' },
        questType: 'assassination',
        questData: {
          targets: [{ characterRef: 'testy', count: 1, name: 'testies' }],
        },
      },
    ];
    await questModel2.save();

    const factory = new HumanNpcFactory(theWorld, pc.room);
    npc1 = await factory.generate({ humanNpc: { name: 'npc1', characterRef: 'test-character1' }});
    npc2 = await factory.generate({ humanNpc: { name: 'npc2', characterRef: 'test-character2' }});
  });

  describe('when you are not on a quest', () => {
    it('tells you', async () => {
      const uut = new QuestCompleteAction();
      await uut.execute(pc);
      assert(pc.transport.sentMessages.some(m => m.includes('You are not on any quests.')));
    });
  });

  describe('when you are not on a quest given by the quest giver', () => {
    beforeEach(() => {
      npc2.questsGiven[0].accept(pc);
      npc2.moveToRoom(rooms[1]);
    });

    it('tells you', async () => {
      const uut = new QuestCompleteAction();
      await uut.execute(pc);
      assert(pc.transport.sentMessages.some(m => m.includes('You are not on any quests given by npc1.')));
    });
  });

  describe('when there is no quest giver', () => {
    beforeEach(() => {
      npc1.questsGiven[0].accept(pc);
      npc2.questsGiven[0].accept(pc);
      npc1.moveToRoom(rooms[1]);
      npc2.moveToRoom(rooms[1]);
    });

    it('tells you', async () => {
      const uut = new QuestCompleteAction();
      await uut.execute(pc);
      assert(pc.transport.sentMessages.some(m => m.includes('You cannot complete any quests here.')));
    });
  });

  describe('when you have not yet completed the quest', () => {
    beforeEach(() => {
      npc1.questsGiven[0].accept(pc);
      npc2.questsGiven[0].accept(pc);
    });

    it('gives you the status update instead', async () => {
      const uut = new QuestCompleteAction();
      await uut.execute(pc);
      assert(npc1.questsGiven[0].characterProgress[pc.id].stageState !== QuestState.STAGE_STATE.COMPLETE);
      // We can't really easily check sent messages here, because messages sent to
      // the room are passed over a message bus which delivers every 10 ms. (TODO.)
      // assert(pc.transport.sentMessages.some(m => m.includes('You are on the quest still!')));
    });
  });

  describe('when you have completed the quest', () => {
    describe('of one of the quest givers', () => {
      beforeEach(async () => {
        npc1.questsGiven[0].accept(pc);

        const factory = new HumanNpcFactory(theWorld, pc.room);
        const testy = await factory.generate({ humanNpc: { name: 'testy', characterRef: 'testy' }});
        pc.addKill(testy);
      });

      it('completes the quest', async () => {
        const uut = new QuestCompleteAction();
        await uut.execute(pc);
        assert(npc1.questsGiven[0].characterProgress[pc.id].stageState === QuestState.STAGE_STATE.COMPLETE);
        assert(pc.questsCompleted.length === 1);
        assert(pc.questsCompleted[0].questId === npc1.questsGiven[0].model.id);
        // We can't really easily check sent messages here, because messages sent to
        // the room are passed over a message bus which delivers every 10 ms. (TODO.)
        // assert(pc.transport.sentMessages.some(m => m.includes('You have completed quest 1')));
      });
    });

    describe('all of the quest givers', () => {
      beforeEach(async () => {
        npc1.questsGiven[0].accept(pc);
        npc2.questsGiven[0].accept(pc);

        const factory = new HumanNpcFactory(theWorld, pc.room);
        const testy = await factory.generate({ humanNpc: { name: 'testy', characterRef: 'testy' }});
        pc.addKill(testy);
      });

      it('completes the quest', async () => {
        const uut = new QuestCompleteAction();
        await uut.execute(pc);
        assert(npc1.questsGiven[0].characterProgress[pc.id].stageState === QuestState.STAGE_STATE.COMPLETE);
        assert(npc2.questsGiven[0].characterProgress[pc.id].stageState === QuestState.STAGE_STATE.COMPLETE);
        assert(pc.questsCompleted.length === 2);
        assert(pc.questsCompleted.some(q => q.questId === npc1.questsGiven[0].model.id));
        assert(pc.questsCompleted.some(q => q.questId === npc2.questsGiven[0].model.id));
        // We can't really easily check sent messages here, because messages sent to
        // the room are passed over a message bus which delivers every 10 ms. (TODO.)
        // assert(pc.transport.sentMessages.some(m => m.includes('You have completed quest 1')));
        // assert(pc.transport.sentMessages.some(m => m.includes('You have completed quest 2')));
      });
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
      assert(result.message === 'Unknown quest command \'wat\': valid quest commands are \'list\', \'status\', \'accept\', and \'complete\'.', result.message);
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

  describe('complete', () => {
    it('returns an error if there is too much information', () => {
      const uut = new QuestFactory();
      const result = uut.generate(['complete', 'bar']);
      assert(result);
      assert(result.message === '\'quest complete\' does not take any other information.', result.message);
    });

    it('returns a complete action', () => {
      const uut = new QuestFactory();
      const result = uut.generate(['complete']);
      assert(result);
      assert(result instanceof QuestCompleteAction);
    });
  });
});
