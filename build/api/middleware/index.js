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
exports.finalizeMiddleware = exports.initMiddleware = void 0;
const express_1 = __importDefault(require("express"));
const bunyan_middleware_1 = __importDefault(require("bunyan-middleware"));
const cors_1 = __importDefault(require("cors"));
const config_1 = __importDefault(require("config"));
const log_js_1 = __importDefault(require("../../lib/log.js"));
const authHandler_js_1 = __importDefault(require("./authHandler.js"));
const defaultErrorHandler_js_1 = __importDefault(require("./defaultErrorHandler.js"));
function initMiddleware(app) {
    // Non-custom middleware
    const allowedOrigins = (config_1.default.api && config_1.default.api.allowedOrigins) || [];
    app.use((0, cors_1.default)({
        credentials: true,
        origin: function (origin, callback) {
            // CURL - we may need to think about this in the long run.
            if (!origin) {
                return callback(null, true);
            }
            if (allowedOrigins.indexOf(origin) === -1) {
                const msg = 'The CORS policy for this site does not allow access ' +
                    `from the specified Origin: ${origin}`;
                return callback(new Error(msg), false);
            }
            return callback(null, true);
        }
    }));
    app.use(express_1.default.json());
    app.use((0, bunyan_middleware_1.default)({
        headerName: 'x-request-id',
        propertyName: 'reqId',
        logName: 'reqId',
        level: 'debug',
        logger: log_js_1.default,
    }));
    app.use(authHandler_js_1.default);
}
exports.initMiddleware = initMiddleware;
function finalizeMiddleware(app) {
    app.use(defaultErrorHandler_js_1.default);
}
exports.finalizeMiddleware = finalizeMiddleware;
