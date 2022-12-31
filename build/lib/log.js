"use strict";
//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bunyan_1 = __importDefault(require("bunyan"));
const bunyan_format_1 = __importDefault(require("bunyan-format"));
const config_1 = __importDefault(require("config"));
const serializers = __importStar(require("./serializers/index.js"));
const name = 'spire-game';
/**
 * Create the one and only logger
 *
 * @returns {bunyan.Logger}
 */
function createLogger() {
    const { level, pretty, filePath: path } = config_1.default.get('log');
    if (level === 'silent') {
        return bunyan_1.default.createLogger({ name, streams: [] });
    }
    const bunyanLevel = level;
    if (path) {
        return bunyan_1.default.createLogger({
            name,
            streams: [{ level: bunyanLevel, path }],
            serializers
        });
    }
    const stream = pretty ? (0, bunyan_format_1.default)({ outputMode: 'short' }) : process.stdout;
    return bunyan_1.default.createLogger({
        name,
        streams: [{ level: bunyanLevel, stream }],
        serializers
    });
}
const log = createLogger();
const { logUncaughtException = undefined } = config_1.default.get('log');
if (logUncaughtException) {
    process.on('uncaughtException', (err) => {
        log.fatal({ err }, 'Uncaught exception');
        process.exit(1);
    });
    process.on('rejectionHandled', (reason) => {
        log.error({ reason }, 'Nevermind; it was handled');
    });
}
exports.default = log;
