//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------
import bunyan from 'bunyan';
import format from 'bunyan-format';
import config from 'config';
import * as serializers from './serializers/index.js';
const name = 'spire-game';
/**
 * Create the one and only logger
 *
 * @returns {bunyan.Logger}
 */
function createLogger() {
    const { level, pretty, filePath: path } = config.get('log');
    if (level === 'silent') {
        return bunyan.createLogger({ name, streams: [] });
    }
    const bunyanLevel = level;
    if (path) {
        return bunyan.createLogger({
            name,
            streams: [{ level: bunyanLevel, path }],
            serializers
        });
    }
    const stream = pretty ? format({ outputMode: 'short' }) : process.stdout;
    return bunyan.createLogger({
        name,
        streams: [{ level: bunyanLevel, stream }],
        serializers
    });
}
const log = createLogger();
const { logUncaughtException = undefined } = config.get('log');
if (logUncaughtException) {
    process.on('uncaughtException', (err) => {
        log.fatal({ err }, 'Uncaught exception');
        process.exit(1);
    });
    process.on('rejectionHandled', (reason) => {
        log.error({ reason }, 'Nevermind; it was handled');
    });
}
export default log;
