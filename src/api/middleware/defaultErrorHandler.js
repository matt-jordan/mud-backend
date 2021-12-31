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