import { Router } from 'express';
import TweetPuppeteer from '../services/TweetPuppeteerService';
import Post from '../models/Post';
const router = Router();

router.get('/api/tweet/', async (req, res) => {
  let url: string;
  let count: number;
  let replies: { message: string; posts: Post[] };
  try {
    if (
      req.query.url &&
      /^(?:https?:\/\/)*twitter.com\/\w+\/status\/\d+$/.test(
        req.query.url.toString()
      )
    ) {
      url = req.query.url.toString();
    } else throw Error('Provided link is invalid.');
    if (req.query.count && parseInt(req.query.count.toString()) * -1 < 0) {
      count = parseInt(req.query.count.toString());
    } else throw Error('Provided post count is invalid.');
    replies = await TweetPuppeteer.getTweetData(url, count);
    replies.posts.length
      ? res.status(200).json(replies)
      : res.status(404).json(replies);
  } catch (error) {
    res.status(400).json({
      message: error.message,
      posts: [],
    });
  }
});

export default router;
