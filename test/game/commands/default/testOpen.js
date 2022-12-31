//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import Door from '../../../../src/game/objects/Door.js';
import DoorModel from '../../../../src/db/models/DoorModel.js';
import { FakeClient, createWorld, destroyWorld } from '../../fixtures.js';
import { OpenAction, OpenFactory } from '../../../../src/game/commands/default/Open.js';


describe('OpenAction', () => {

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
    it('tells the player that there is no door to open', async () => {
      const uut = new OpenAction('door');
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
      it('tells the player that there is no door to open', async () => {
        const uut = new OpenAction('new-door');
        await uut.execute(pc);
        assert(pc.transport.sentMessages.length === 1);
        assert.match(pc.transport.sentMessages[0], /You do not see a new-door here/);
      });
    });

    describe('when the direction is specified incorrectly', async () => {
      it('tells the player that there is no door to open', async () => {
        const uut = new OpenAction('south.door');
        await uut.execute(pc);
        assert(pc.transport.sentMessages.length === 1);
        assert.match(pc.transport.sentMessages[0], /You do not see a south.door here/);
      });
    });

    describe('when the door exists', () => {
      describe('when the door is locked', () => {
        beforeEach(() => {
          pc.room.exits['north'].door.model.hasLock = true;
          pc.room.exits['north'].door.isLocked = true;
        });

        it('tells them it is locked', async () => {
          const uut = new OpenAction('door');
          await uut.execute(pc);
          assert(pc.transport.sentMessages.length === 1);
          assert.match(pc.transport.sentMessages[0], /The door is locked/);
        });
      });

      describe('when the door is already open', () => {
        beforeEach(() => {
          pc.room.exits['north'].door.isOpen = true;
        });

        it('tells them it is open', async () => {
          const uut = new OpenAction('door');
          await uut.execute(pc);
          assert(pc.transport.sentMessages.length === 1);
          assert.match(pc.transport.sentMessages[0], /The door is already open/);
        });
      });

      describe('when the door is unlocked and closed', () => {
        beforeEach(() => {
          pc.room.exits['north'].door.model.hasLock = true;
          pc.room.exits['north'].door.isLocked = false;
          pc.room.exits['north'].door.isOpen = false;
        });

        it('opens the door', async () => {
          const uut = new OpenAction('door');
          await uut.execute(pc);
          assert(pc.transport.sentMessages.length === 1);
          assert.match(pc.transport.sentMessages[0], /You open the door/);
          assert(pc.room.exits['north'].door.isOpen === true);
        });
      });
    });
  });
});

describe('OpenFactory', () => {

  it('produces an open action', () => {
    const uut = new OpenFactory();
    assert(uut);
    const action = uut.generate(['the', 'door']);
    assert(action);
    assert(action instanceof OpenAction);
    assert(action.target === 'the door');
  });

});