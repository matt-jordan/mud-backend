//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------
/**
 * @module game/characters/quests/CurrencyQuestReward
 */
/**
 * Create a quest reward that gives currency to the actor
 */
class CurrencyQuestReward {
    /**
     * Create a new currency quest reward
     *
     * @param {Object} model
     * @param {String} model.rewardType = 'currency' - The type of reward
     * @param {Object} model.data
     * @param {String} model.data.name               - The type of currency to award
     * @param {Number} model.data.quantity           - How much to give
     */
    constructor(model) {
        this.model = model;
    }
    /**
     * Issue the reward to the actor of the quest
     *
     * @param {Character}  character - The character who granted the quest
     * @param {Character}  actor     - The actor of the quest
     */
    reward(character, actor) {
        const { name, quantity } = this.model.data;
        actor.sendImmediate(`You receive ${quantity} ${name} coin${quantity !== 1 ? 's' : ''} from ${character.toShortText()}.`);
        actor.currencies.deposit(name, quantity);
    }
}
export default CurrencyQuestReward;
