import Puppeteer from 'puppeteer';
import Bent from 'bent';
import Post from '../models/Post';
import User from '../models/User';
import _values from 'lodash.values';
import atob from 'atob';
import { createLogger, format, transports } from 'winston';
import dailyRotateFile from 'winston-daily-rotate-file';

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    format.simple()
  ),
  transports: [
    new dailyRotateFile({
      filename: 'application-%DATE%.log',
      datePattern: 'YYYY-MM-DD-HH',
      maxSize: '10m',
    }),
  ],
});

export default abstract class TweetPuppeteerService {
  public static async getTweetData(
    url: string,
    count: number
  ): Promise<{ message: string; data: { posts: Post[]; users: User[] } }> {
    // these are Chrome DevTools Protocol objects, no reliable source of types data so "any"
    logger.info('getTweetData called.');
    const requests: any[] = [];
    const extraInfo: any[] = [];
    const browser = await Puppeteer.launch({
      headless: true,
      defaultViewport: null,
      devtools: true,
    });
    logger.info('chrome launched.');
    const [page] = await browser.pages();
    const client = await page.target().createCDPSession();
    await this.enableCDPDomains(client);

    client.on('Network.requestWillBeSentExtraInfo', (request) => {
      extraInfo.push(request);
    });

    client.on('Fetch.requestPaused', async (request) => {
      const bodyString = atob(
        ((await client.send('Fetch.getResponseBody', {
          requestId: request.requestId,
        })) as { body: string; base64Encoded: boolean }).body
      );
      try {
        request.body = JSON.parse(bodyString);
      } catch (error) {
        request.body = {};
      }
      requests.push(request);
      await client.send('Fetch.continueRequest', {
        requestId: request.requestId,
      });
    });

    await page.goto(url);
    await page.waitForRequest((req) => {
      return /init.json/.test(req.url());
    });
    logger.info('init.json aquired, closing chrome.');
    browser.close();

    const requestHeaders = this.buildRequestHeaders(requests, extraInfo, count);
    let message: string;
    let posts: Post[];
    let users: User[];
    if (!requestHeaders) {
      message = 'No thread found under provided link.';
      posts = [];
      users = [];
    } else {
      const bentRequest = Bent('https://api.twitter.com', 'string');
      const res = JSON.parse(
        await bentRequest(requestHeaders.path, undefined, requestHeaders)
      );
      message = 'ok';
      posts = _values(res.globalObjects.tweets).map((v) => {
        return new Post(
          v.conversation_id_str,
          v.created_at,
          v.id_str,
          v.full_text,
          v.user_id_str,
          v.retweet_count,
          v.favorite_count,
          v.reply_count,
          v.quote_count
        );
      });
      users = _values(res.globalObjects.users).map((v) => {
        return new User(
          v.id_str,
          v.name,
          v.screen_name,
          v.profile_image_url_https,
          v.description,
          v.favourites_count,
          v.followers_count,
          v.friends_count
        );
      });
    }
    return new Promise<{
      message: string;
      data: { posts: Post[]; users: User[] };
    }>((resolve) => {
      resolve({
        message: message,
        data: {
          posts: posts,
          users: users,
        },
      });
    });
  }

  private static async enableCDPDomains(
    client: Puppeteer.CDPSession
  ): Promise<void> {
    await client.send('Network.enable');
    await client.send('Fetch.enable', {
      patterns: [
        {
          urlPattern:
            '*https://api.twitter.com/*/timeline/conversation/*.json*',
          resourceType: 'XHR',
          requestStage: 'Response',
        },
      ],
    });
    return Promise.resolve();
  }

  // TODO: This should probably be refactored, getting too long.
  private static buildRequestHeaders(
    requests: any[],
    extraInfo: any[],
    repliesCount: number
  ): Record<string, string> | false {
    // Merge request data and extraInfo and send it to get response
    //  - Pick the correct request (the one with dot in networkId)
    const correctRequest = requests
      .filter((value) => {
        return /\./.test(value.networkId);
      })
      .pop();
    logger.info(`correct requests - ${JSON.stringify(correctRequest)}`);
    if (correctRequest.body.errors) {
      logger.info(
        `correct request has errors in body - returns false - ${JSON.stringify(
          correctRequest.body.errors
        )}`
      );
      return false;
    }
    // - pick the extraInfo that is associated with correct request
    const requestExtraInfo = extraInfo
      .filter((value) => {
        return value.requestId === correctRequest.networkId;
      })
      .pop();
    logger.info(
      `requestExtraInfo associated - ${JSON.stringify(requestExtraInfo)}`
    );
    // - pick the extraInfo with all the cookies that we need
    const requestExtraInfoCookies = extraInfo
      .filter((value) => {
        return value.headers.cookie !== undefined;
      })
      .pop();
    logger.info(
      `requestExtraInfoCookies - ${JSON.stringify(requestExtraInfoCookies)}`
    );
    // - merge headers
    const requestHeaders: Record<string, string> = {
      ...correctRequest.headers,
      ...requestExtraInfo.headers,
    };
    // - replace cookies with the correct ones
    requestHeaders.cookie = requestExtraInfoCookies.headers.cookie;
    // - clean the headers keys
    for (const key in requestHeaders) {
      if (/^:.*$/.test(key)) {
        requestHeaders[key.slice(1)] = requestHeaders[key];
        delete requestHeaders[key];
      }
    }
    // - replace the default count=20 for custom count
    requestHeaders.path = requestHeaders.path.replace(
      /&count=20&/,
      `&count=${repliesCount}&`
    );
    return requestHeaders;
  }
}
