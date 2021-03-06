//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

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

class UnauthorizedError extends ErrorBase {
  constructor(message) {
    super(message || 'Unauthorized');
    this.statusCode = 401;
  }
}

class ForbiddenError extends ErrorBase {
  constructor(message) {
    super(message || 'Forbidden');
    this.statusCode = 403;
  }
}

class NotFoundError extends ErrorBase {
  constructor(message) {
    super(message || 'Not Found');
    this.statusCode = 404;
  }
}

class ConflictError extends ErrorBase {
  constructor(message) {
    super(message || 'Conflict');
    this.statusCode = 409;
  }
}

export {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
};