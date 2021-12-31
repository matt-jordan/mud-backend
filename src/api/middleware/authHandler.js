
import SessionModel from '../../db/models/Session.js';
import { UnauthorizedError, ForbiddenError } from '../../lib/errors.js';
import log from '../../lib/log.js';

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
      log.debug({ req }, 'Ignoring auth check for this route');
      return true;
    }
    return false;
  });

  if (match) {
    next();
    return;
  }

  // We may want to eventually switch to JWT, but for now our simplistic model
  // is good enough.
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return next(new ForbiddenError());
  }

  const headerValue = authHeader.split(' ');
  if (headerValue.length !== 2) {
    return next(new ForbiddenError());
  }

  const token = headerValue[1];
  if (!token) {
    return next(new ForbiddenError());
  }

  SessionModel.findBySessionId(token).then(session => {
    if (!session) {
      return next(new UnauthorizedError());
    }

    next();
  });
};

export default authHandler;
