import Puppeteer from 'puppeteer';
import Bent from 'bent';
import Post from '../models/Post';
import _values from 'lodash.values';

export default abstract class TweetPuppeteerService {
  public static async getTweetData(
    url: string,
    count: number
  ): Promise<Post[]> {
    // these are Chrome DevTools Protocol objects, no reliable source of types data so "any"
    let requests: any[] = [];
    let extraInfo: any[] = [];
    const browser = await Puppeteer.launch({
      headless: true,
      defaultViewport: null,
      devtools: true,
    });
    const [page] = await browser.pages();
    const client = await page.target().createCDPSession();
    await this.enableCDPDomains(client);

    client.on('Network.requestWillBeSentExtraInfo', (request) => {
      if (extraInfo === undefined) extraInfo = [];
      extraInfo.push(request);
    });

    client.on('Fetch.requestPaused', async (request) => {
      if (requests === undefined) requests = [];
      requests.push(request);
      await client.send('Fetch.continueRequest', {
        requestId: request.requestId,
      });
    });

    await page.goto(url);
    await page.waitForSelector('[role=region]');
    browser.close();

    const requestHeaders = this.buildRequestHeaders(requests, extraInfo, count);
    const bentRequest = Bent('https://api.twitter.com', 'string');
    const res = JSON.parse(
      await bentRequest(requestHeaders.path, undefined, requestHeaders)
    );
    return new Promise<any>((resolve) => {
      resolve(
        _values(res.globalObjects.tweets).map((v) => {
          return new Post(
            v.id_str,
            v.full_text,
            v.user_id_str,
            v.retweet_count,
            v.favourite_count,
            v.reply_count,
            v.quote_count
          );
        })
      );
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
          requestStage: 'Request',
        },
      ],
    });
    return Promise.resolve();
  }

  private static buildRequestHeaders(
    requests: any[],
    extraInfo: any[],
    repliesCount: number
  ): Record<string, string> {
    // Merge request data and extraInfo and send it to get response
    //  - Pick the correct request (the one with dot in networkId)
    const correctRequest = requests
      .filter((value) => {
        return /\./.test(value.networkId);
      })
      .pop();
    // - pick the extraInfo that is associated with correct request
    const requestExtraInfo = extraInfo
      .filter((value) => {
        return value.requestId === correctRequest.networkId;
      })
      .pop();
    // - pick the extraInfo with all the cookies that we need
    const requestExtraInfoCookies = extraInfo
      .filter((value) => {
        return value.headers.cookie !== undefined;
      })
      .pop();
    // - merge headers
    const requestHeaders: Record<string, string> = {
      ...correctRequest.headers,
      ...requestExtraInfo.headers,
    };
    // - replace cookies with the correct ones
    requestHeaders.cookie = requestExtraInfoCookies.headers.cookie;
    // - clean the headers keys
    requestHeaders['method'] = requestHeaders[':method'];
    requestHeaders['authority'] = requestHeaders[':authority'];
    requestHeaders['scheme'] = requestHeaders[':scheme'];
    requestHeaders['path'] = requestHeaders[':path'];
    delete requestHeaders[':method'];
    delete requestHeaders[':authority'];
    delete requestHeaders[':scheme'];
    delete requestHeaders[':path'];
    // - replace the default count=20 for custom count
    requestHeaders.path = requestHeaders.path.replace(
      /&count=20&/,
      `&count=${repliesCount}&`
    );
    return requestHeaders;
  }
}
