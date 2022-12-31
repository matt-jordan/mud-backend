"use strict";
//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
function getOpposingDirection(direction) {
    switch (direction.toLowerCase()) {
        case 'north':
            return 'south';
        case 'south':
            return 'north';
        case 'east':
            return 'west';
        case 'west':
            return 'east';
        case 'up':
            return 'down';
        case 'down':
            return 'up';
        case 'northwest':
            return 'southeast';
        case 'southeast':
            return 'northwest';
        case 'northeast':
            return 'southwest';
        case 'southwest':
            return 'northeast';
        default:
            return 'unknown';
    }
}
exports.default = getOpposingDirection;
