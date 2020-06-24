import puppeteer from 'puppeteer';

class Post {
  favourite_count = 0;
  full_text = '';
  quote_count = 0;
  reply_count = 0;
  retweet_count = 0;
}

export default {
  async getTweetData(url: string, count: number): Promise<any> {
    let responseBody: any;
    const browser = await puppeteer.launch({ headless: false });
    const [page] = await browser.pages();
    // page.setRequestInterception(true);
    // page.on('request', (interceptedRequest) => {
    //   if (this.isValidDataUrl(interceptedRequest.url())) {
    //     interceptedRequest.continue({
    //       url: interceptedRequest
    //         .url()
    //         .replace(/&count=\d+&/, `&count=${count}&`),
    //     });
    //   }
    //   interceptedRequest.continue();
    // });
    page.on('requestfinished', async (request) => {
      console.log('gotowy request');
      if (
        this.isValidDataUrl(request.url()) &&
        request.response()?.headers()['content-length'] !== '0'
      ) {
        console.log('prawidłowy request');
        responseBody = await request.response()?.json();
      }
    });
    await page.goto(url);
    await page.waitForSelector('[role=region]');
    browser.close();
    return new Promise<any>((resolve) => {
      console.log('jestem! ' + responseBody);
      resolve(responseBody);
    });
  },

  isValidDataUrl(url: string): boolean {
    return /^https:\/\/api.twitter.com\/\d+\/timeline\/conversation\/\d+.json/.test(
      url
    );
  },
};
