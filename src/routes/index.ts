import { Router } from 'express';
import TweetPuppeteer from '../services/TweetPuppeteerService';
import Post from '../models/Post';
import User from '../models/User';
const router = Router();

router.get('/tweet', async (req, res) => {
  let url: string;
  let count: number;
  let replies: { message: string; data: { posts: Post[]; users: User[] } };
  try {
    if (
      req.query.url &&
      /^(?:https?:\/\/)*(?:mobile.)*twitter.com\/\w+\/status\/\d+$/.test(
        req.query.url.toString()
      )
    ) {
      url = req.query.url.toString();
    } else throw Error('Provided link is invalid.');
    if (req.query.count && parseInt(req.query.count.toString()) * -1 < 0) {
      count = parseInt(req.query.count.toString());
    } else throw Error('Provided post count is invalid.');
    replies = await TweetPuppeteer.getTweetData(url, count);
    replies.data.posts.length
      ? res.status(200).json(replies)
      : res.status(404).json(replies);
  } catch (error) {
    res.status(400).json({
      message: error.message,
      trace: error.stack,
      posts: [],
    });
  }
});

export default router;
