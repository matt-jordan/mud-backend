//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
const asyncForEach = function (array, callback) {
    return __awaiter(this, void 0, void 0, function* () {
        for (let i = 0; i < array.length; i++) {
            yield callback(array[i], i, array);
        }
    });
};
export default asyncForEach;
