//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _ActionEffectQueue_queue;
/**
 * @module game/characters/helpers/ActionEffectQueue
 */
/**
 * A queue for actions or effects that a character has enqueued on them
 */
class ActionEffectQueue {
    /**
     * Create a new action/effect queue
     */
    constructor() {
        _ActionEffectQueue_queue.set(this, void 0);
        __classPrivateFieldSet(this, _ActionEffectQueue_queue, [], "f");
    }
    /**
     * Decrement the tick counter on all the items in the queue, eject the expired
     * entries and return them
     *
     * @returns {List}
     */
    decrementAndExpire() {
        var _a, _b;
        const expiredItems = [];
        const remainingItems = [];
        while (__classPrivateFieldGet(this, _ActionEffectQueue_queue, "f").length !== 0) {
            const item = __classPrivateFieldGet(this, _ActionEffectQueue_queue, "f").pop();
            item.tick -= 1;
            if (item.tick > 0) {
                (_a = item.onTick) === null || _a === void 0 ? void 0 : _a.call(item);
            }
            // Do a two-pass check as onTick may decrement the tick count as well
            if (item.tick > 0) {
                remainingItems.push(item);
                continue;
            }
            (_b = item.onExpire) === null || _b === void 0 ? void 0 : _b.call(item);
            expiredItems.push(item);
        }
        __classPrivateFieldSet(this, _ActionEffectQueue_queue, remainingItems, "f");
        return expiredItems;
    }
    /**
     * Returns true if every item in the underlying queue matches a predicate
     *
     * @param {Function} callbackFn
     * @param {Object}   thisArg
     *
     * @returns {Boolean}
     */
    every(callbackFn, thisArg) {
        return __classPrivateFieldGet(this, _ActionEffectQueue_queue, "f").every(callbackFn, thisArg);
    }
    /**
     * Finds and returns an element that matches a predicate
     *
     * @param {Function} callbackFn
     * @param {Object}   thisArg
     *
     * @returns {Object}
     */
    find(callbackFn, thisArg) {
        return __classPrivateFieldGet(this, _ActionEffectQueue_queue, "f").find(callbackFn, thisArg);
    }
    /**
     * Find and remove all instances of an item
     *
     * @param {Object} item
     */
    remove(item) {
        __classPrivateFieldSet(this, _ActionEffectQueue_queue, __classPrivateFieldGet(this, _ActionEffectQueue_queue, "f").filter((i) => i !== item), "f");
    }
    /**
     * Push an item onto the queue
     *
     * @param {Object} item - The action/effect item
     */
    push(item) {
        var _a;
        (_a = item.onInitialPush) === null || _a === void 0 ? void 0 : _a.call(item);
        __classPrivateFieldGet(this, _ActionEffectQueue_queue, "f").push(item);
    }
    /**
     * The number of items in the queue
     *
     * @returns {Number}
     */
    get length() {
        return __classPrivateFieldGet(this, _ActionEffectQueue_queue, "f").length;
    }
}
_ActionEffectQueue_queue = new WeakMap();
export default ActionEffectQueue;
