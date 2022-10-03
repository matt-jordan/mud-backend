//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import Quest from '../../characters/quests/Quest.js';
import { ErrorAction } from './Error.js';

/**
 * Action that lists quests from a quest giver
 */
class QuestListAction {

  /**
   * Create a new QuestList action
   */
  constructor() {
  }

  /**
   * Execute the action on the character
   *
   * @param {Character} character - The player character
   */
  async execute(character) {
    const room = character.room;
    if (!room) {
      character.sendImmediate('You are floating in a void');
      return;
    }

    const questGivers = room.characters.all.filter(c => {
      return ((c.id !== character.id) && (c.questsGiven.length > 0));
    });
    if (questGivers.length === 0) {
      character.sendImmediate('There are no quest givers here.');
      return;
    }

    let message = '';
    questGivers.forEach((questGiver) => {
      let questMessage = '';
      questGiver.questsGiven.forEach((quest, i) => {
        if (quest.characterCheck(character)) {
          questMessage += `  #${i + 1} - ${quest.characterOnQuest(character) ? '[ACTIVE] ' : ''}`;
          questMessage += `${quest.toDescription()}\n`;
        }
      });
      if (questMessage.length === 0) {
        message += `${questGiver.toShortText()} has no quests for you.\n`;
      } else {
        message += `${questGiver.toShortText()} has the follow quests for you:\n${questMessage}`;
      }
    });
    character.sendImmediate(message);
  }
}

/**
 * Action that accepts quests
 */
class QuestAcceptAction {

  /**
   * Create a new QuestAccept action
   *
   * @param {Object} params
   * @param {String} params.quest - The quest to take on
   */
  constructor(params) {
    this.quest = params.quest;
  }

  /**
   * Execute the action on the character
   *
   * @param {Character} character - The player character
   */
  async execute(character) {
    const room = character.room;
    if (!room) {
      character.sendImmediate('You are floating in a void');
      return;
    }

    const questGivers = room.characters.all.filter(c => {
      return ((c.id !== character.id) && (c.questsGiven.length > 0));
    });
    if (questGivers.length === 0) {
      character.sendImmediate('There are no quest givers here.');
      return;
    }

    const quests = questGivers.reduce((previous, questGiver) => previous.concat(questGiver.questsGiven), []);
    const quest = quests.find((q) => q.model.name.toLowerCase() === this.quest.toLowerCase());
    if (!quest) {
      character.sendImmediate(`No one here has a quest named '${this.quest}' for you.`);
      return;
    }

    if (!(quest.characterCheck(character))) {
      character.sendImmediate(`${quest.character.toShortText()} refuses to give you '${this.quest}'.`);
      return;
    }

    if (quest.characterOnQuest(character)) {
      character.sendImmediate(`You are already on '${this.quest}'`);
      return;
    }

    character.sendImmediate(`You accept quest '${this.quest}'`);
    quest.accept(character);
  }
}

/**
 * Action that displays the status of quests
 */
class QuestStatusAction {

  /**
   * Create a new QuestStatus action
   */
  constructor() {
  }

  /**
   * Execute the action on the character
   *
   * @param {Character} character - The player character
   */
  async execute(character) {
    const quests = Quest.activeQuests(character);
    if (!quests || quests.length === 0) {
      character.sendImmediate('You are not on any quests.');
      return;
    }

    let message = 'You are on the following quests:\n';
    quests.forEach((quest) => {
      message += `${quest.toText(character)}\n`;
    });

    character.sendImmediate(message);
  }
}

/**
 * Action that completes quests
 */
class QuestCompleteAction {

  /**
   * Create a new QuestComplete action
   */
  constructor() {

  }

  /**
   * Execute the action on the character
   *
   * @param {Character} character - The player character
   */
  async execute(character) {
    const room = character.room;
    if (!room) {
      character.sendImmediate('You are floating in a void');
      return;
    }

    const quests = Quest.activeQuests(character);
    if (!quests || quests.length === 0) {
      character.sendImmediate('You are not on any quests.');
      return;
    }
    const questCharacterRefs = new Set(quests.map(q => q.model.questGiver));

    const questGivers = room.characters.all
      .filter(c => { return ((c.id !== character.id) && (c.questsGiven.length > 0)); });
    if (questGivers.length === 0) {
      character.sendImmediate('You cannot complete any quests here.');
      return;
    }
    const questGiverCharacterRefs = new Set(questGivers.map(c => c.characterRef));

    const unavailableQuestGivers = questGivers.filter((c => !questCharacterRefs.has(c.characterRef)));
    unavailableQuestGivers.forEach((questGiver) => {
      character.sendImmediate(`You are not on any quests given by ${questGiver.toShortText()}.`)
    });

    const availableQuests = quests.filter(q => questGiverCharacterRefs.has(q.model.questGiver));
    if (availableQuests.length === 0) {
      character.sendImmediate('You cannot complete any quests here.');
      return;
    }

    availableQuests.forEach((quest) => {
      quest.complete(character);
    });

  }
}

/**
 * Quests are a bit weird in that we have a number of sub-commands:
 *  - quest list            - List available quests from a quest giver
 *  - quest accept {String} - Accept quests
 *  - quest status          - Provide a status for your active quests
 *
 * We have a specific factory for all three, and dispatch it out to different
 * QuestActions.
 */
class QuestFactory {

  /**
   * The name of the command family
   */
  static get name() {
    return 'quest';
  }

  /**
   * Create a new quest factory
   */
  constructor() {
  }

  /**
   * Generate an action from the provided player input
   *
   * @param {Array.<String>} tokens - The text the player provided
   *
   * @return {MoveAction} On success, the action to execute, or null
   */
  generate(tokens) {
    if (tokens.length === 0) {
      return new ErrorAction({ command: 'quest', message: 'What do you want to know about quests?' });
    }

    switch(tokens[0].toLowerCase()) {
    case 'list':
      if (tokens.length !== 1) {
        return new ErrorAction({ command: 'quest', message: '\'quest list\' does not take any other information.' });
      }
      return new QuestListAction();
    case 'accept':
      if (tokens.length === 1) {
        return new ErrorAction({ command: 'quest', message: 'You must specify what quest you want to accept.' });
      }
      return new QuestAcceptAction({ quest: tokens.slice(1, tokens.length).join(' ') });
    case 'status':
      if (tokens.length !== 1) {
        return new ErrorAction({ command: 'quest', message: '\'quest status\' does not take any other information.' });
      }
      return new QuestStatusAction();
    case 'complete':
      if (tokens.length !== 1) {
        return new ErrorAction({ command: 'quest', message: '\'quest complete\' does not take any other information.' });
      }
      return new QuestCompleteAction();
    default:
      return new ErrorAction({ command: 'quest', message: `Unknown quest command '${tokens[0]}': valid quest commands are 'list', 'status', 'accept', and 'complete'.` });
    }
  }
}

export {
  QuestFactory,
  QuestAcceptAction,
  QuestListAction,
  QuestStatusAction,
  QuestCompleteAction,
};