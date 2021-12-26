import { Router } from 'express';

const router = Router();

router.get('/:accountId', (req, res) => {
  return res.send({ message: 'Success' }).status(200);
});

router.post('/:accountId', (req, res) => {
  throw new Error('Broken');
});

export default router;