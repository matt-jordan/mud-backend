//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import QuestModel from '../../../src/db/models/QuestModel.js';

describe('QuestModel', () => {

  describe('updateFromLoad', () => {
    let loadObj;
    let existingObject;

    beforeEach(async () => {
      existingObject = new QuestModel();
      existingObject.name = 'something something';
      existingObject.loadInfo.loadId = 'existing';
      await existingObject.save();

      loadObj = {
        version: 1,
        name: 'Test Quest',
        description: 'A description',
        questGiver: 'foo',
        restrictions: [
          {
            restrictionType: 'faction',
            data: {
              property: 'prop1',
            },
          },
          {
            restrictionType: 'level',
            data: {
              minLevel: 1,
              maxLevel: 10,
            },
          },
        ],
        stages: [
          {
            onStatusCheck: {
              text: 'status check',
            },
            questType: 'assassination',
            questData: {
              otherStuff: 1,
            },
          },
          {
            onAccept: {
              text: 'accept check',
            },
            onCompletion: {
              text: 'completion check'
            },
            questType: 'assassination',
            questData: {
              property: 'prop',
            },
            rewards: [
              {
                rewardType: 'faction',
                data: {
                  something: 100,
                },
              },
              {
                rewardType: 'currency',
                data: {
                  name: 'gold',
                  quantity: 100,
                },
              },
            ],
          },
        ],
      };
    });

    afterEach(() => {
      loadObj = null;
    });

    it('skips the update if the version is not higher', async () => {
      loadObj.version = 0;
      await existingObject.updateFromLoad(loadObj);
      assert(existingObject.name !== loadObj.name);
    });

    it('skips the update if the loadId does not match', async () => {
      loadObj.loadId = 'does-not-match';
      await existingObject.updateFromLoad(loadObj);
      assert(existingObject.name !== loadObj.name);
    });

    it('loads the properties into the roomModel', async () => {
      loadObj.loadId = 'existing';
      await existingObject.updateFromLoad(loadObj);
      assert(existingObject.name === loadObj.name);
      assert(existingObject.description === loadObj.description);
      assert(existingObject.questGiver === loadObj.questGiver);
      assert(existingObject.restrictions.length === loadObj.restrictions.length);
      assert(existingObject.restrictions[0].restrictionType === loadObj.restrictions[0].restrictionType);
      assert(existingObject.restrictions[0].data.property === loadObj.restrictions[0].data.property);
      assert(existingObject.restrictions[1].restrictionType === loadObj.restrictions[1].restrictionType);
      assert(existingObject.restrictions[1].data.minLevel === loadObj.restrictions[1].data.minLevel);
      assert(existingObject.restrictions[1].data.maxLevel === loadObj.restrictions[1].data.maxLevel);
      assert(existingObject.stages[0].onStatusCheck.text === loadObj.stages[0].onStatusCheck.text);
      assert(existingObject.stages[0].questType === loadObj.stages[0].questType);
      assert(existingObject.stages[0].questData.otherStuff === loadObj.stages[0].questData.otherStuff);
      assert(existingObject.stages[1].onAccept.text === loadObj.stages[1].onAccept.text);
      assert(existingObject.stages[1].onCompletion.text === loadObj.stages[1].onCompletion.text);
      assert(existingObject.stages[1].questType === loadObj.stages[1].questType);
      assert(existingObject.stages[1].questData.property === loadObj.stages[1].questData.property);
      assert(existingObject.stages[1].rewards.length === loadObj.stages[1].rewards.length);
      assert(existingObject.stages[1].rewards[0].rewardType === loadObj.stages[1].rewards[0].rewardType);
      assert(existingObject.stages[1].rewards[1].rewardType === loadObj.stages[1].rewards[1].rewardType);
    });

  });

});
