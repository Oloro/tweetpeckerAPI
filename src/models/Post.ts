export default class Post {
  private idStr = '';
  private fullText = '';
  private userIdStr = '';
  private retweetCount = 0;
  private favouriteCount = 0;
  private replyCount = 0;
  private quoteCount = 0;

  constructor(
    idStr: string,
    fullText: string,
    userIdStr: string,
    retweetCount: number,
    favouriteCount: number,
    replyCount: number,
    quoteCount: number
  ) {
    this.idStr = idStr;
    this.fullText = fullText;
    this.userIdStr = userIdStr;
    this.retweetCount = retweetCount;
    this.favouriteCount = favouriteCount;
    this.replyCount = replyCount;
    this.quoteCount = quoteCount;
  }
}