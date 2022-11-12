//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------
/**
 * @module lib/randomInteger
 */
/**
 * Compute a random integer between two numbers
 *
 * With respect to stackoverflow
 *
 * @param {Number} min - The minimum
 * @param {Number} max - The maximum
 *
 * @return {Number}
 */
function randomInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}
export default randomInteger;
