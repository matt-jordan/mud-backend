//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import Door from '../../../../build/game/objects/Door.js';
import DoorModel from '../../../../build/db/models/DoorModel.js';
import { FakeClient, createWorld, destroyWorld } from '../../fixtures.js';
import { CloseAction, CloseFactory } from '../../../../build/game/commands/default/Close.js';


describe('CloseAction', () => {

  let pc;

  beforeEach(async () => {
    const results = await createWorld();
    pc = results.pc1;
    pc.transport = new FakeClient();
  });

  afterEach(async () => {
    await destroyWorld();
  });

  describe('when the room has no doors', () => {
    it('tells the player that there is no door to close', async () => {
      const uut = new CloseAction('door');
      await uut.execute(pc);
      assert(pc.transport.sentMessages.length === 1);
      assert.match(pc.transport.sentMessages[0], /You do not see a door here/);
    });
  });

  describe('when a door exists', () => {
    beforeEach(async () => {
      const doorModel = new DoorModel();
      doorModel.name = 'door';
      await doorModel.save();

      const door = new Door(doorModel);
      await door.load();

      pc.room.exits['north'].door = door;
    });

    afterEach(async () => {
      await DoorModel.deleteMany();
    });

    describe('when the door is specified incorrectly', async () => {
      it('tells the player that there is no door to close', async () => {
        const uut = new CloseAction('new-door');
        await uut.execute(pc);
        assert(pc.transport.sentMessages.length === 1);
        assert.match(pc.transport.sentMessages[0], /You do not see a new-door here/);
      });
    });

    describe('when the direction is specified incorrectly', async () => {
      it('tells the player that there is no door to close', async () => {
        const uut = new CloseAction('south.door');
        await uut.execute(pc);
        assert(pc.transport.sentMessages.length === 1);
        assert.match(pc.transport.sentMessages[0], /You do not see a south.door here/);
      });
    });

    describe('when the door exists', () => {
      describe('when the door is already closed', () => {
        beforeEach(() => {
          pc.room.exits['north'].door.isOpen = false;
        });

        it('tells them it is closed', async () => {
          const uut = new CloseAction('door');
          await uut.execute(pc);
          assert(pc.transport.sentMessages.length === 1);
          assert.match(pc.transport.sentMessages[0], /The door is already closed/);
        });
      });

      describe('when the door is open', () => {
        beforeEach(() => {
          pc.room.exits['north'].door.isOpen = true;
        });

        it('closes the door', async () => {
          const uut = new CloseAction('door');
          await uut.execute(pc);
          assert(pc.transport.sentMessages.length === 1);
          assert.match(pc.transport.sentMessages[0], /You close the door/);
          assert(pc.room.exits['north'].door.isOpen === false);
        });
      });
    });
  });
});

describe('CloseFactory', () => {

  it('produces a close action', () => {
    const uut = new CloseFactory();
    assert(uut);
    const action = uut.generate(['the', 'door']);
    assert(action);
    assert(action instanceof CloseAction);
    assert(action.target === 'the door');
  });

});