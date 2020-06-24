import { Router, urlencoded } from 'express';
const router = Router();

router.get('/api/tweet/', (req, res) => {
  try {
    if (req.query.url) {
      const url = req.query.url;
    } else throw Error('invalid url');
    if (req.query.count) {
      const count = req.query.url;
    } else throw Error('invalid count');
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }

  res.send('Hello world!');
});

export default router;
