//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import Door from '../../../build/game/objects/Door.js';
import DoorModel from '../../../build/db/models/DoorModel.js';

describe('Door', () => {

  describe('basic props', () => {

    let model;
    let uut;

    beforeEach(async () => {
      model = new DoorModel();
      model.name = 'test door';
      model.description = 'A test door';
      model.isOpen = true;
      model.hasLock = true;
      model.lockInfo = {};
      model.lockInfo.isLocked = true;
      model.lockInfo.inanimateId = 'keyId';
      await model.save();

      uut = new Door(model);
      await uut.load();
    });

    afterEach(async () => {
      await DoorModel.deleteMany();
    });

    it('ID', () => {
      assert(model._id === uut.id);
    });

    it('name', () => {
      assert(model.name === uut.name);
    });

    describe('isOpen', () => {
      it('get', () => {
        assert(model.isOpen === uut.isOpen);
      });

      it('set', () => {
        uut.isOpen = false;
        assert(uut.isOpen === false);
      });
    });

    it('hasLock', () => {
      assert(model.hasLock === uut.hasLock);
    });

    describe('isLocked', () => {
      it('get', () => {
        assert(model.lockInfo.isLocked === uut.isLocked);
      });

      it('set', () => {
        uut.isLocked = false;
        assert(uut.isLocked === false);
      });
    });

    it('keyInanimateId', () => {
      assert(uut.keyInanimateId === model.lockInfo.inanimateId);
    });

    it('toShortText', () => {
      assert(uut.toShortText() === model.name);
    });

    it('toLongText', () => {
      assert(uut.toLongText() === model.description);
    });
  });

  describe('actions', () => {
    const messages = [];
    const roomMessages = [];
    const fakeCharacter = {
      room: {
        roomMessages: [],
        sendImmediate: (_, text) => { roomMessages.push(text); },
      },
      messages: [],
      sendImmediate: (text) => { messages.push(text); },
      toShortText: () => { return 'fakeCharacter'; },
    };

    let model;

    beforeEach(async () => {
      model = new DoorModel();
      model.name = 'door';
      model.description = 'A test door';
      model.lockinfo = {};
      await model.save();
    });

    afterEach(async () => {
      DoorModel.deleteMany();
      roomMessages.length = 0;
      messages.length = 0;
    });

    describe('open', () => {
      it('does not open the door if it is already open', async () => {
        model.isOpen = true;
        const uut = new Door(model);
        await uut.load();
        uut.open(fakeCharacter);
        assert(uut.isOpen === true);
        assert(messages.length === 1);
        assert(roomMessages.length === 0);
      });

      it('does not open the door if it is locked', async () => {
        model.isOpen = false;
        model.hasLock = true;
        model.lockInfo.isLocked = true;
        const uut = new Door(model);
        await uut.load();
        uut.open(fakeCharacter);
        assert(uut.isOpen === false);
        assert(messages.length === 1);
        assert(roomMessages.length === 0);
      });

      it('opens the door', async () => {
        model.isOpen = false;
        const uut = new Door(model);
        await uut.load();
        uut.open(fakeCharacter);
        assert(uut.isOpen === true);
        assert(messages.length === 1);
        assert(roomMessages.length === 1);
      });
    });

    describe('close', () => {
      it('does not close the door if its closed', async () => {
        model.isOpen = false;
        const uut = new Door(model);
        await uut.load();
        uut.close(fakeCharacter);
        assert(uut.isOpen === false);
        assert(messages.length === 1);
        assert(roomMessages.length === 0);
      });

      it('closes the door', async () => {
        model.isOpen = true;
        const uut = new Door(model);
        await uut.load();
        uut.close(fakeCharacter);
        assert(uut.isOpen === false);
        assert(messages.length === 1);
        assert(roomMessages.length === 1);
      });
    });

    describe('lock', () => {
      const key = { inanimateId: 'mykey', toShortText: () => 'poo', };

      it('does not lock it if the door is open', async () => {
        model.isOpen = true;
        model.hasLock = true;
        model.lockInfo.inanimateId = 'mykey';
        model.lockInfo.isLocked = false;
        const uut = new Door(model);
        await uut.load();
        uut.lock(fakeCharacter, key);
        assert(uut.isOpen === true);
        assert(uut.isLocked === false);
        assert(messages.length === 1);
        assert(roomMessages.length === 0);
      });

      it('does not lock it if the door does not have a lock', async () => {
        model.isOpen = false;
        model.hasLock = false;
        model.lockInfo.inanimateId = 'mykey';
        model.lockInfo.isLocked = false;
        const uut = new Door(model);
        await uut.load();
        uut.lock(fakeCharacter, key);
        assert(uut.isLocked === false);
        assert(messages.length === 1);
        assert(roomMessages.length === 0);
      });

      it('does not lock it if it is locked already', async () => {
        model.isOpen = false;
        model.hasLock = true;
        model.lockInfo.inanimateId = 'mykey';
        model.lockInfo.isLocked = true;
        const uut = new Door(model);
        await uut.load();
        uut.lock(fakeCharacter, key);
        assert(uut.isLocked === true);
        assert(messages.length === 1);
        assert(roomMessages.length === 0);
      });

      it('does not lock if the key is wrong', async () => {
        model.isOpen = false;
        model.hasLock = true;
        model.lockInfo.inanimateId = 'mykey2';
        model.lockInfo.isLocked = false;
        const uut = new Door(model);
        await uut.load();
        uut.lock(fakeCharacter, key);
        assert(uut.isLocked === false);
        assert(messages.length === 1);
        assert(roomMessages.length === 0);
      });

      it('locks the door', async () => {
        model.isOpen = false;
        model.hasLock = true;
        model.lockInfo.inanimateId = 'mykey';
        model.lockInfo.isLocked = false;
        const uut = new Door(model);
        await uut.load();
        uut.lock(fakeCharacter, key);
        assert(uut.isLocked === true);
        assert(messages.length === 1);
        assert(roomMessages.length === 1);
      });
    });

    describe('unlock', () => {
      const key = { inanimateId: 'mykey', toShortText: () => 'poo', };

      it('does not unlock it if the door is open', async () => {
        model.isOpen = true;
        model.hasLock = true;
        model.lockInfo.inanimateId = 'mykey';
        model.lockInfo.isLocked = true;
        const uut = new Door(model);
        await uut.load();
        uut.unlock(fakeCharacter, key);
        assert(uut.isLocked === true);
        assert(messages.length === 1);
        assert(roomMessages.length === 0);
      });

      it('does not unlock it if it does not have a lock', async () => {
        model.isOpen = false;
        model.hasLock = false;
        model.lockInfo.inanimateId = 'mykey';
        model.lockInfo.isLocked = true;
        const uut = new Door(model);
        await uut.load();
        uut.unlock(fakeCharacter, key);
        assert(uut.isLocked === true);
        assert(messages.length === 1);
        assert(roomMessages.length === 0);
      });

      it('does not unlock it if is it unlocked', async () => {
        model.isOpen = false;
        model.hasLock = true;
        model.lockInfo.inanimateId = 'mykey';
        model.lockInfo.isLocked = false;
        const uut = new Door(model);
        await uut.load();
        uut.unlock(fakeCharacter, key);
        assert(uut.isLocked === false);
        assert(messages.length === 1);
        assert(roomMessages.length === 0);
      });

      it('does not unlock it if the key is wrong', async () => {
        model.isOpen = false;
        model.hasLock = true;
        model.lockInfo.inanimateId = 'mykey2';
        model.lockInfo.isLocked = true;
        const uut = new Door(model);
        await uut.load();
        uut.unlock(fakeCharacter, key);
        assert(uut.isLocked === true);
        assert(messages.length === 1);
        assert(roomMessages.length === 0);
      });

      it('unlocks the door', async () => {
        model.isOpen = false;
        model.hasLock = true;
        model.lockInfo.inanimateId = 'mykey';
        model.lockInfo.isLocked = true;
        const uut = new Door(model);
        await uut.load();
        uut.unlock(fakeCharacter, key);
        assert(uut.isLocked === false);
        assert(messages.length === 1);
        assert(roomMessages.length === 1);
      });
    });
  });
});