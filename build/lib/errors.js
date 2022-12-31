"use strict";
//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConflictError = exports.NotFoundError = exports.ForbiddenError = exports.UnauthorizedError = exports.BadRequestError = void 0;
class ErrorBase extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
    }
}
class BadRequestError extends ErrorBase {
    constructor(message) {
        super(message || 'Bad Request');
        this.statusCode = 400;
    }
}
exports.BadRequestError = BadRequestError;
class UnauthorizedError extends ErrorBase {
    constructor(message) {
        super(message || 'Unauthorized');
        this.statusCode = 401;
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends ErrorBase {
    constructor(message) {
        super(message || 'Forbidden');
        this.statusCode = 403;
    }
}
exports.ForbiddenError = ForbiddenError;
class NotFoundError extends ErrorBase {
    constructor(message) {
        super(message || 'Not Found');
        this.statusCode = 404;
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends ErrorBase {
    constructor(message) {
        super(message || 'Conflict');
        this.statusCode = 409;
    }
}
exports.ConflictError = ConflictError;
