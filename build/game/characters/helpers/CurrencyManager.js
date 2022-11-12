//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------
/**
 * @module game/characters/helpers/CurrencyManager
 */
/**
 * A currency
 *
 * Note that we don't have exchange rates just yet. Someday. Someday.
 * Or weights. That one will be more annoying for players.
 */
class Currency {
    /**
     * Create a new currency
     */
    constructor() {
        this._balance = 0;
    }
    /**
     * The balance
     *
     * @returns {Number}
     */
    get balance() {
        return this._balance;
    }
    /**
     * Deposit some amount
     *
     * @param {Number} amount - how much to add
     */
    deposit(amount) {
        this._balance += amount;
    }
    /**
     * Withdraw an amount
     *
     * Exceeding the balance will simply return all that is available.
     *
     * @param {Number} amount - how much to withdraw
     * @returns {Number}
     */
    withdraw(amount) {
        if (amount > this._balance) {
            amount = this._balance;
        }
        this._balance -= amount;
        return amount;
    }
}
/**
 * A character's personal money manager
 *
 * I wouldn't say this is overkill, as having multiple currencies at some point
 * in time would be a lot of fun. For now, let's just put in the basics of a
 * wrapper so I don't have to do some really tricky refactoring later.
 */
class CurrencyManager {
    /**
     * Create a new currency manager
     */
    constructor() {
        this.currencies = {};
    }
    /**
     * Get the balance for a particular currency type
     *
     * @param {String} type - The type to get the balance for
     *
     * @returns {Number}
     */
    balance(type) {
        if (!type) {
            return Object.values(this.currencies).reduce((value, c) => value + c.balance, 0);
        }
        if (!(type in this.currencies)) {
            return 0;
        }
        return this.currencies[type].balance;
    }
    /**
     * Add currency
     *
     * @param {String} type   - The type to deposit
     * @param {Number} amount - The amount to deposit
     */
    deposit(type, amount) {
        if (!(type in this.currencies)) {
            this.currencies[type] = new Currency();
        }
        this.currencies[type].deposit(amount);
    }
    /**
     * Withdraw some currency
     *
     * @param {String} type   - The type to withdraw
     * @param {Number} amount - The amount to withdraw
     *
     * @returns {Number}
     */
    withdraw(type, amount) {
        if (!(type in this.currencies)) {
            return 0;
        }
        return this.currencies[type].withdraw(amount);
    }
    /**
     * Return a JSON representation (suitable for saving) of the currencies
     *
     * @returns Array
     */
    toJSON() {
        return Object.keys(this.currencies).map((key) => {
            return {
                name: key,
                quantity: this.currencies[key].balance,
            };
        });
    }
}
export default CurrencyManager;
