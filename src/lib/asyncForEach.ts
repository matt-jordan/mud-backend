//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

/**
 * @module lib/asyncForEach
 */

/**
 * A callback type for asyncForEach
 *
 * @async
 * @callback AsyncForEachCallback<T>
 * @param {T}        entry - The entry in the array being invoked
 * @param {number}   i     - The index of the array
 * @param {Array<T>} array - The full array itself
 */

type AsyncForEachCallback<T> = (entry: T, i: number, array: T[]) => Promise<void>;

/**
 * Iterate over an array and await invocations of a callback asynchronously
 *
 * This little helper is for those situations where you have an array of things
 * that have an asynchronous function and you want to halt progress until all
 * of them are completed. It will call them synchronously, which may not be the
 * most efficient but is easy to reason about.
 *
 * @param {Array<T>}                array    - The array to walk
 * @param {AsyncForEachCallback<T>} callback - Callback function
 */
const asyncForEach = async function<T>(array: T[], callback: AsyncForEachCallback<T>) {
  for (let i = 0; i < array.length; i++) {
    await callback(array[i], i, array);
  }
};

export default asyncForEach;