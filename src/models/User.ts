export default class User {
  private idStr = '';
  private name = '';
  private screenName = '';
  private profileImageUrl = '';
  private description = '';
  private favouritesCount = 0;
  private followersCount = 0;
  private friendsCount = 0;

  constructor(
    idStr: string,
    name: string,
    screenName: string,
    profileImageUrl: string,
    description: string,
    favouritesCount: number,
    followersCount: number,
    friendsCount: number
  ) {
    this.idStr = idStr;
    this.name = name;
    this.screenName = screenName;
    this.profileImageUrl = profileImageUrl;
    this.description = description;
    this.favouritesCount = favouritesCount;
    this.followersCount = followersCount;
    this.friendsCount = friendsCount;
  }
}
