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
exports.req = exports.err = void 0;
const err_js_1 = __importDefault(require("./err.js"));
exports.err = err_js_1.default;
const req_js_1 = __importDefault(require("./req.js"));
exports.req = req_js_1.default;
