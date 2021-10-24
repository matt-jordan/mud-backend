import express from 'express';

async function boot() {

  const app = express();
  app.use((req, res, next) => {
    res.set('x-powered-by', 'hope');
    next();
  });
  app.set('trust proxy', true);

  app.use(express.static('dist'));

  return app;
}

export default boot;