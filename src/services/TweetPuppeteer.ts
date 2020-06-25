import Puppeteer from 'puppeteer';
import Bent from 'bent';
import { request } from 'express';

class Post {
  favourite_count = 0;
  full_text = '';
  quote_count = 0;
  reply_count = 0;
  retweet_count = 0;
}

export default {
  async getTweetData(url: string, count: number): Promise<any> {
    let posts: Post[];
    let requests: any[] = [];
    let extraInfo: any[] = [];
    const browser = await Puppeteer.launch({
      headless: true,
      defaultViewport: null,
      devtools: true,
    });
    const [page] = await browser.pages();
    const client = await page.target().createCDPSession();
    await client.send('Network.enable');

    client.on('Network.requestWillBeSentExtraInfo', (request) => {
      if (extraInfo === undefined) extraInfo = [];
      extraInfo.push(request);
    });

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
    const requestHeaders: any = {
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

    const test = Bent('https://api.twitter.com', 'json');
    const res = await test(requestHeaders.path, undefined, requestHeaders);
    console.log(res);

    return new Promise<any>((resolve) => {
      resolve(5);
    });
  },

  isValidDataUrl(url: string): boolean {
    return /^https:\/\/api.twitter.com\/\d+\/timeline\/conversation\/\d+.json/.test(
      url
    );
  },
};
