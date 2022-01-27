//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import PlayerCharacter from '../../../../src/game/characters/playerCharacter.js';
import { InventoryAction, InventoryFactory } from '../../../../src/game/commands/default/Inventory.js';

describe('InventoryAction', () => {
  const receivedMessages = [];
  const pc = {
    physicalLocations: {},
    sendImmediate: (msg) => {
      receivedMessages.push(msg);
    },
  };

  beforeEach(() => {
    PlayerCharacter.physicalLocations.forEach((location) => {
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
    });

    it('handles when a PC has everything', async () => {
      pc.physicalLocations = {};
      pc.physicalLocations.head = { toShortText: () => 'HeadThing' };
      pc.physicalLocations.neck = { toShortText: () => 'NeckThing' };
      pc.physicalLocations.body = { toShortText: () => 'BodyThing' };
      pc.physicalLocations.back = { toShortText: () => 'BackThing' };
      pc.physicalLocations.legs = { toShortText: () => 'LegsThing' };
      pc.physicalLocations.feet = { toShortText: () => 'FeetThing' };
      pc.physicalLocations.hands = { toShortText: () => 'HandsThing' };
      pc.physicalLocations.leftFinger = { toShortText: () => 'LeftFingerThing' };
      pc.physicalLocations.rightFinger = { toShortText: () => 'RightFingerThing' };
      pc.physicalLocations.leftHand = { toShortText: () => 'LeftHandThing' };
      pc.physicalLocations.rightHand = { toShortText: () => 'RightHandThing' };
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
    });
  });
});

describe('InventoryFactory', () => {
  describe('when generating an action', () => {
    it('by default it generates the action to be displayed as a text message', () => {
      const factory = new InventoryFactory();
      const result = factory.generate([]);
      assert(result);
      assert(result.displayType === 'text');
    });
  });
});
