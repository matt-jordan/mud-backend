//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------

import log from '../../lib/log.js';

const defaultErrorHandler = (err, req, res, next) => {
  if (!err) {
    return next();
  }

  if (!err.statusCode) {
    res.status(500);
    log.error({ err }, 'Unhandled API exception');
  } else {
    res.status(err.statusCode);
  }
  res.json({ message: err.message });
};

export default defaultErrorHandler;