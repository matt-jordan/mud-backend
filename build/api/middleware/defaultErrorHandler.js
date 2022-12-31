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
const log_js_1 = __importDefault(require("../../lib/log.js"));
const defaultErrorHandler = (err, req, res, next) => {
    if (!err) {
        return next();
    }
    if (!err.statusCode) {
        res.status(500);
        log_js_1.default.error({ err }, 'Unhandled API exception');
    }
    else {
        res.status(err.statusCode);
    }
    res.json({ message: err.message });
};
exports.default = defaultErrorHandler;
