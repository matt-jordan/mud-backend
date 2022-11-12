//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------
import express from 'express';
import bunyanMiddlware from 'bunyan-middleware';
import cors from 'cors';
import config from 'config';
import log from '../../lib/log.js';
import authHandler from './authHandler.js';
import defaultErrorHandler from './defaultErrorHandler.js';
function initMiddleware(app) {
    // Non-custom middleware
    const allowedOrigins = (config.api && config.api.allowedOrigins) || [];
    app.use(cors({
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
    app.use(express.json());
    app.use(bunyanMiddlware({
        headerName: 'x-request-id',
        propertyName: 'reqId',
        logName: 'reqId',
        level: 'debug',
        logger: log,
    }));
    app.use(authHandler);
}
function finalizeMiddleware(app) {
    app.use(defaultErrorHandler);
}
export { initMiddleware, finalizeMiddleware, };
