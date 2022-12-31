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
const SessionModel_js_1 = __importDefault(require("../../db/models/SessionModel.js"));
const errors_js_1 = require("../../lib/errors.js");
const log_js_1 = __importDefault(require("../../lib/log.js"));
const authHandler = (req, res, next) => {
    // Very few routes should be excluded from an auth check. These are:
    // - Creating a new account
    // - Logging in
    const ignored_path = [
        {
            verb: 'POST',
            path: /^\/accounts\/(.*)$/,
        },
        {
            verb: 'POST',
            path: /^\/login$/,
        }
    ];
    const match = ignored_path.find((element) => {
        if (element.verb === req.method && element.path.test(req.path)) {
            log_js_1.default.debug({ req }, 'Ignoring auth check for this route');
            return true;
        }
        return false;
    });
    if (match) {
        return next();
    }
    // We may want to eventually switch to JWT, but for now our simplistic model
    // is good enough.
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return next(new errors_js_1.ForbiddenError());
    }
    const headerValue = authHeader.split(' ');
    if (headerValue.length !== 2) {
        return next(new errors_js_1.ForbiddenError());
    }
    const token = headerValue[1];
    if (!token) {
        return next(new errors_js_1.ForbiddenError());
    }
    SessionModel_js_1.default.findBySessionId(token).then(session => {
        if (!session) {
            return next(new errors_js_1.UnauthorizedError());
        }
        next();
    });
};
exports.default = authHandler;
