import { Router } from 'express';
import TweetPuppeteer from '../services/TweetPuppeteer';
const router = Router();

router.get('/api/tweet/', async (req, res) => {
  let url: string;
  let count: number;
  let responseUrl: any;
  try {
    if (req.query.url) {
      url = req.query.url.toString();
    } else throw Error('invalid url');
    if (req.query.count) {
      count = parseInt(req.query.url.toString());
    } else throw Error('invalid count');
    responseUrl = await TweetPuppeteer.getTweetData(url, count);
    console.log(responseUrl);
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }

  res.json(responseUrl);
});

export default router;
