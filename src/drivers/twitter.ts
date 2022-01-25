import Twitter from "twitter-lite";

export class TwitterDriver {
  public client: Twitter;
  constructor(private readonly consumer_key: string, private readonly consumer_secret: string) {
    this.consumer_key = consumer_key;
    this.consumer_secret = consumer_secret;

    this.client = new Twitter({
      consumer_key: this.consumer_key,
      consumer_secret: this.consumer_secret,
    });
  }

  async tweet(message: string): Promise<void> {
    await this.client.post("statuses/update", { status: message });
  }

  async tweetMedia(media: Buffer, options: TweetOptions): Promise<string> {
    const client = new Twitter({
      consumer_key: this.consumer_key,
      consumer_secret: this.consumer_secret,
    });

    const media_id = await client.post("media/upload", { media });
    const tweet_id = await client.post("statuses/update", {
      status: options.text,
      media_ids: media_id.media_id_string,
    });

    return tweet_id.id_str;
  }
}
