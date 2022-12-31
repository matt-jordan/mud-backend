"use strict";
//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
exports.physicalLocationToText = exports.textToPhysicalLocation = void 0;
/**
 * @module lib/physicalLocation
 */
/**
 * Convert raw text into a possible physical location
 *
 * @param {String} text - The text to convert
 *
 * @returns {String} An acceptable physical location on a character
 */
function textToPhysicalLocation(text) {
    switch (text.toLowerCase()) {
        case 'head':
            return 'head';
        case 'body':
            return 'body';
        case 'neck':
            return 'neck';
        case 'hands':
            return 'hands';
        case 'legs':
            return 'legs';
        case 'feet':
            return 'feet';
        case 'leftfinger':
        case 'left finger':
            return 'leftFinger';
        case 'rightfinger':
        case 'right finger':
            return 'rightFinger';
        case 'lefthand':
        case 'left hand':
            return 'leftHand';
        case 'righthand':
        case 'right hand':
            return 'rightHand';
        case 'back':
            return 'back';
        default:
            return null;
    }
}
exports.textToPhysicalLocation = textToPhysicalLocation;
/**
 * Convert an acceptable physical location on a character into human friendly text
 *
 * @param {String} location - The acceptable physical location on a character
 *
 * @returns {String} human readable text
 */
function physicalLocationToText(location) {
    switch (location) {
        case 'head':
            return 'head';
        case 'body':
            return 'body';
        case 'neck':
            return 'neck';
        case 'hands':
            return 'hands';
        case 'legs':
            return 'legs';
        case 'feet':
            return 'feet';
        case 'leftFinger':
            return 'left finger';
        case 'rightFinger':
            return 'right finger';
        case 'leftHand':
            return 'left hand';
        case 'rightHand':
            return 'right hand';
        case 'back':
            return 'back';
        default:
            return null;
    }
}
exports.physicalLocationToText = physicalLocationToText;
