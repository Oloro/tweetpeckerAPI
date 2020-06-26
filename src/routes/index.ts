import { Router } from 'express';
import TweetPuppeteer from '../services/TweetPuppeteerService';
import Post from '../models/Post';
const router = Router();

router.get('/api/tweet/', async (req, res) => {
  let url: string;
  let count: number;
  let replies: Post[];
  try {
    if (req.query.url) {
      url = req.query.url.toString();
    } else throw Error('invalid url');
    if (req.query.count) {
      count = parseInt(req.query.count.toString());
    } else throw Error('invalid count');
    replies = await TweetPuppeteer.getTweetData(url, count);
    res.json(replies);
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
});

export default router;
