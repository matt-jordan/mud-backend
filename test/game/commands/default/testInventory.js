//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import Character from '../../../../src/game/characters/Character.js';
import { InventoryAction, InventoryFactory } from '../../../../src/game/commands/default/Inventory.js';

describe('InventoryAction', () => {
  const receivedMessages = [];
  const pc = {
    physicalLocations: {},
    currencies: {
      toJSON: () => [],
    },
    inanimates: [],
    sendImmediate: (msg) => {
      receivedMessages.push(msg);
    },
  };

  beforeEach(() => {
    Character.physicalLocations.forEach((location) => {
      pc.physicalLocations[location] = null;
    });
    receivedMessages.length = 0;
  });

  describe('text', () => {
    it('handles when a PC has nothing', async () => {
      const action = new InventoryAction('text');
      assert(action);
      await action.execute(pc);
      assert(receivedMessages.length === 1);
      assert.match(receivedMessages[0], /Head: Nothing/);
      assert.match(receivedMessages[0], /Neck: Nothing/);
      assert.match(receivedMessages[0], /Body: Nothing/);
      assert.match(receivedMessages[0], /Back: Nothing/);
      assert.match(receivedMessages[0], /Legs: Nothing/);
      assert.match(receivedMessages[0], /Feet: Nothing/);
      assert.match(receivedMessages[0], /Hand: Nothing/);
      assert.match(receivedMessages[0], /Left Finger: Nothing/);
      assert.match(receivedMessages[0], /Right Finger: Nothing/);
      assert.match(receivedMessages[0], /Left Hand: Nothing/);
      assert.match(receivedMessages[0], /Right Hand: Nothing/);
      assert.match(receivedMessages[0], /Money: None/);
    });

    it('handles when a PC has everything', async () => {
      pc.physicalLocations = {};
      pc.physicalLocations.head = { item: { toShortText: () => 'HeadThing' } };
      pc.physicalLocations.neck = { item: { toShortText: () => 'NeckThing' } };
      pc.physicalLocations.body = { item: { toShortText: () => 'BodyThing' } };
      pc.physicalLocations.back = { item: { toShortText: () => 'BackThing' } };
      pc.physicalLocations.legs = { item: { toShortText: () => 'LegsThing' } };
      pc.physicalLocations.feet = { item: { toShortText: () => 'FeetThing' } };
      pc.physicalLocations.hands = { item: { toShortText: () => 'HandsThing' } };
      pc.physicalLocations.leftFinger = { item: { toShortText: () => 'LeftFingerThing' } };
      pc.physicalLocations.rightFinger = { item: { toShortText: () => 'RightFingerThing' } };
      pc.physicalLocations.leftHand = { item: { toShortText: () => 'LeftHandThing' } };
      pc.physicalLocations.rightHand = { item: { toShortText: () => 'RightHandThing' } };
      pc.currencies = {
        toJSON: () => {
          return [
            {
              name: 'gold',
              quantity: 50,
            },
            {
              name: 'platinum',
              quantity: 100,
            },
          ];
        },
      };
      const action = new InventoryAction('text');
      assert(action);
      await action.execute(pc);
      assert(receivedMessages.length === 1);
      assert.match(receivedMessages[0], /Head: HeadThing/);
      assert.match(receivedMessages[0], /Neck: NeckThing/);
      assert.match(receivedMessages[0], /Body: BodyThing/);
      assert.match(receivedMessages[0], /Back: BackThing/);
      assert.match(receivedMessages[0], /Legs: LegsThing/);
      assert.match(receivedMessages[0], /Feet: FeetThing/);
      assert.match(receivedMessages[0], /Hands: HandsThing/);
      assert.match(receivedMessages[0], /Left Finger: LeftFingerThing/);
      assert.match(receivedMessages[0], /Right Finger: RightFingerThing/);
      assert.match(receivedMessages[0], /Left Hand: LeftHandThing/);
      assert.match(receivedMessages[0], /Right Hand: RightHandThing/);
      assert.match(receivedMessages[0], /Money: 50 gold; 100 platinum/);
    });
  });
});

describe('InventoryFactory', () => {
  describe('when generating an action', () => {
    it('by default it generates the action to be displayed as a text message', () => {
      const factory = new InventoryFactory();
      const result = factory.generate();
      assert(result);
      assert(result.displayType === 'text');
    });
  });
});
