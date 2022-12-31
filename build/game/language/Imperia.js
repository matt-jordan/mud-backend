"use strict";
//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const interpreter_js_1 = require("./interpreter.js");
const randomInteger_js_1 = __importDefault(require("../../lib/randomInteger.js"));
const vowels = ['a', 'e', 'i', 'o', 'u', 'ou'];
const consanants = ['b', 'c', 'd', 'f', 'h', 'j', 'ch', 'l', 'm', 'n', 'p', 'r',
    's', 't', 'v', 'w', 'x', 'y', 'al'];
class Imperia {
    static get name() {
        return 'imperia';
    }
    static interpret(message, skill) {
        if (skill === 100) {
            return message;
        }
        const tokens = message.split(' ');
        const result = [];
        tokens.forEach((token) => {
            const chance = (0, randomInteger_js_1.default)(0, 100);
            if (chance <= skill) {
                result.push(token);
            }
            else {
                const syllables = (0, interpreter_js_1.parseIntoSyllables)(token);
                let resultWord = '';
                syllables.forEach((syllable) => {
                    const syllableChance = (0, randomInteger_js_1.default)(0, 100);
                    if (syllableChance <= skill) {
                        resultWord += syllable;
                    }
                    else {
                        for (let i = 0; i < syllable.length; i++) {
                            if (vowels.includes(syllable.charAt(i))) {
                                resultWord += vowels[(0, randomInteger_js_1.default)(0, vowels.length - 1)];
                            }
                            else {
                                resultWord += consanants[(0, randomInteger_js_1.default)(0, consanants.length - 1)];
                            }
                        }
                    }
                });
                result.push(resultWord);
            }
        });
        return result.join(' ');
    }
}
exports.default = Imperia;
