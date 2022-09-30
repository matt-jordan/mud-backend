//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import conversationTransformation from '../helpers/conversationTransformation.js';
import log from '../../../lib/log.js';

/**
 * @module game/characters/quests/AssassinationQuestStrategy
 */

/**
 * A quest type where we go off and kill some things and get rewarded for it
 *
 * Witness the violence inherent in the system.
 */
class AssassinationQuestStrategy {

  /**
   * Make a new Assassination quest
   *
   * @param {QuestModel} model - The questData of the quest model that we care about
   */
  constructor(model) {
    this.model = model;
  }

  /**
   * Called when the actor has asked how they're doing
   *
   * @param {Character}  character - The quest giver
   * @param {Character}  actor     - The actor of the quest
   * @param {QuestState} state     - State object
   */
  checkStatus(character, actor, state) {
    if (!(this.model) || !(this.model.onStatusCheck) || !(this.model.onStatusCheck.text)) {
      return;
    }

    let newText;
    const actorQuestData = state.actorQuestData;

    newText = conversationTransformation(this.model.onStatusCheck.text, actor);
    const currentIndex = newText.indexOf('{{current');
    if (currentIndex > -1) {
      const endIndex = newText.indexOf('}}', currentIndex);
      const replaceString = newText.substring(currentIndex, endIndex + 2);
      const periodIndex = replaceString.indexOf('.');
      const characterRef = replaceString.substring(periodIndex + 1, replaceString.length - 2);

      if (characterRef in actorQuestData) {
        newText = newText.replace(replaceString, `${actorQuestData[characterRef]}`);
      }
    }

    const countIndex = newText.indexOf('{{count');
    if (countIndex > -1) {
      const endIndex = newText.indexOf('}}', countIndex);
      const replaceString = newText.substring(countIndex, endIndex + 2);
      const periodIndex = replaceString.indexOf('.');
      const characterRef = replaceString.substring(periodIndex + 1, replaceString.length - 2);

      const target = this.model.targets.find((target) => target.characterRef === characterRef);
      if (target) {
        newText = newText.replace(replaceString, `${target.count}`);
      }
    }

    character.room.sendImmediate([character],
      {
        socialType: 'say',
        language: character.language || 'common',
        sender: `${character.toShortText()}`,
        text: conversationTransformation(newText, actor),
      }
    );
  }

  /**
   * Called when the actor has accepted the assassination quest
   *
   * @param {Character}  actor - The actor of the quest
   * @param {QuestState} state - The object holding the state of the quest
   */
  accept(actor, state) {
    const killCallback = (character, killedCharacter) => {
      if (character.id !== actor.id) {
        return;
      }

      const characterRef = killedCharacter.characterRef;
      const target = this.model.targets.find((target) => target.characterRef === characterRef);
      if (!target) {
        return;
      }

      const actorQuestData = state.actorQuestData;
      if (!(characterRef in actorQuestData)) {
        actorQuestData[characterRef] = 0;
      }
      actorQuestData[characterRef] += 1;
      log.debug({ characterRef, characterId: actor.id, currentKills: actorQuestData[characterRef], goalKills: target.count },
        `Character killed a ${killedCharacter.toShortText()}`);

      // Check to see if the quest should be done
      if (this.model.targets.every((target) => {
        if (!(target.characterRef in actorQuestData)) {
          return false;
        }
        return actorQuestData[target.characterRef] >= target.count;
      })) {
        state.pendingCompleteStage();
        actor.removeListener('kill', killCallback);
      }
    };
    actor.on('kill', killCallback);
  }

  /**
   * Called when the actor has notified the quest giver of completion
   *
   * Right now this exists due to the interface we have. At some point this could
   * trigger some reset of spawns or some other function; for now, we just ignore it.
   */
  complete() {
  }

}

export default AssassinationQuestStrategy;
