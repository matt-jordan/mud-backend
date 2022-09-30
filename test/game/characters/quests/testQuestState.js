//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import assert from 'power-assert';

import QuestState from '../../../../src/game/characters/quests/QuestState.js';

class MockRoom {
  constructor(character) {
    this.character = character;
    this.messages = [];
  }

  sendImmediate(sender, message) {
    this.messages.push({ sender, message });
  }
}

class MockStage {

  constructor() {
    this.acceptCalled = false;
    this.checkStatusCalled = false;
    this.completeCalled = false;
  }

  complete() {
    this.completeCalled = true;
  }

  accept() {
    this.acceptCalled = true;
  }

  checkStatus() {
    this.checkStatusCalled = true;
  }
}

class MockCharacter {

  constructor(name) {
    this.id = name;
    this.name = name;
    this.room = new MockRoom();
  }

  toShortText() {
    return this.name;
  }
}

describe('QuestState', () => {

  let character;
  let actor;

  beforeEach(() => {
    character = new MockCharacter('character');
    actor = new MockCharacter('actor');
  });

  describe('setStage', () => {
    it('sets the stage', () => {
      const stage = new MockStage();
      const uut = new QuestState(character, actor);
      uut.setStage(stage, 1);
      assert(uut.stageIndex === 1);
      assert(uut._currentState === QuestState.STAGE_STATE.NOT_STARTED);
    });
  });

  describe('accept', () => {
    it('starts the stage', () => {
      const stage = new MockStage();
      const uut = new QuestState(character, actor);
      uut.setStage(stage, 0);
      assert(uut._currentState === QuestState.STAGE_STATE.NOT_STARTED);
      uut.accept();
      assert(stage.acceptCalled);
      assert(uut._currentState === QuestState.STAGE_STATE.IN_PROGRESS);
    });
  });

  describe('checkStatus', () => {
    it('checks the status', () => {
      const stage = new MockStage();
      const uut = new QuestState(character, actor);
      uut.setStage(stage, 0);
      uut.checkStatus();
      assert(stage.checkStatusCalled);
    });
  });

  describe('pendingCompleteStage', () => {
    it('does not switch the status if the stage is not in progress', () => {
      const stage = new MockStage();
      const uut = new QuestState(character, actor);
      uut.setStage(stage, 0);
      assert(uut.pendingCompleteStage() === false);
      assert(uut._currentState === QuestState.STAGE_STATE.NOT_STARTED);
    });

    it('switches the status if it is in progress', () => {
      const stage = new MockStage();
      const uut = new QuestState(character, actor);
      uut.setStage(stage, 0);
      uut.accept();
      assert(uut.pendingCompleteStage() === true);
      assert(uut._currentState === QuestState.STAGE_STATE.PENDING_COMPLETE);
    });
  });

  describe('completeStage', () => {
    it('does not switch the status if the stage is not pending completion', () => {
      const stage = new MockStage();
      const uut = new QuestState(character, actor);
      uut.setStage(stage, 0);
      assert(uut.completeStage() === false);
      assert(uut._currentState === QuestState.STAGE_STATE.NOT_STARTED);
    });

    it('switches the status if it is in pending completion', () => {
      const stage = new MockStage();
      const uut = new QuestState(character, actor);
      uut.setStage(stage, 0);
      uut.accept();
      uut.pendingCompleteStage();
      assert(uut.completeStage());
      assert(stage.completeCalled);
      assert(uut._currentState === QuestState.STAGE_STATE.COMPLETE);
    });
  });
});