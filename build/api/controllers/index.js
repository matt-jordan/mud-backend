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
const accounts_js_1 = __importDefault(require("./accounts.js"));
const characters_js_1 = __importDefault(require("./characters.js"));
const login_js_1 = __importDefault(require("./login.js"));
function initControllers(app) {
    app.use('/accounts', accounts_js_1.default);
    app.use('/characters', characters_js_1.default);
    app.use('/login', login_js_1.default);
}
exports.default = initControllers;
