import { Router } from 'express';
import TweetPuppeteer from '../services/TweetPuppeteer';
const router = Router();

router.get('/api/tweet/', async (req, res) => {
  let url: string;
  let count: number;
  let replies: any;
  try {
    if (req.query.url) {
      url = req.query.url.toString();
    } else throw Error('invalid url');
    if (req.query.count) {
      count = parseInt(req.query.count.toString());
    } else throw Error('invalid count');
    replies = await TweetPuppeteer.getTweetData(url, count);
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }

  res.json(replies);
});

export default router;
