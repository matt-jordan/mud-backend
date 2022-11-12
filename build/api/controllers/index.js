//------------------------------------------------------------------------------
// MJMUD Backend
// Copyright (C) 2022, Matt Jordan
//
// This program is free software, distributed under the terms of the
// MIT License. See the LICENSE file at the top of the source tree.
//------------------------------------------------------------------------------
import accounts from './accounts.js';
import characters from './characters.js';
import login from './login.js';
function initControllers(app) {
    app.use('/accounts', accounts);
    app.use('/characters', characters);
    app.use('/login', login);
}
export default initControllers;
