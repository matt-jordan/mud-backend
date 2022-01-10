import accounts from './accounts.js';
import characters from './characters.js';
import login from './login.js';

function initControllers(app) {
  app.use('/accounts', accounts);
  app.use('/characters', characters);
  app.use('/login', login);
}

export default initControllers;
