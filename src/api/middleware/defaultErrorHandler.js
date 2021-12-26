import log from '../../lib/log.js';

const defaultErrorHandler = (err, req, res, next) => {
  log.error({ err }, 'Unhandled API exception');
  res.status(500).json({ error: err });
  next();
};

export default defaultErrorHandler;