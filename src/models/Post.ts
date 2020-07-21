export default class Post {
  private conversationIdStr = '';
  private createdAt = '';
  private idStr = '';
  private fullText = '';
  private userIdStr = '';
  private retweetCount = 0;
  private favoriteCount = 0;
  private replyCount = 0;
  private quoteCount = 0;

  constructor(
    conversationIdStr: string,
    createdAt: string,
    idStr: string,
    fullText: string,
    userIdStr: string,
    retweetCount: number,
    favoriteCount: number,
    replyCount: number,
    quoteCount: number
  ) {
    this.conversationIdStr = conversationIdStr;
    this.createdAt = createdAt;
    this.idStr = idStr;
    this.fullText = fullText;
    this.userIdStr = userIdStr;
    this.retweetCount = retweetCount;
    this.favoriteCount = favoriteCount;
    this.replyCount = replyCount;
    this.quoteCount = quoteCount;
  }
}
