export interface InstanceConfig {
  options: {
    /* The text attached before the source. */
    status: string,
    /* Example output: Status here (Source here) */
    includeSource: boolean,
    /* If this is enabled, status will be ignored. */
    enableQuotes: boolean,
    /* An array of different quotes, picked at random. */
    quotes: Array<string>,
  },
  gelbooru: {
    api_key: string,
    user_id: string,
  },
  /* Enable/disable drivers. Make sure to fill in their configuration options for access tokens and keys. */
  enabled: {
    [key: string]: boolean,
    Twitter: boolean,
    Mastodon: boolean,
    Telegram: boolean,
    Discord: boolean,
  },
  twitter: {
    consumer_key: string,
    consumer_secret: string,
    access_token_key: string,
    access_token_secret: string,
  },
  mastodon: {
    access_token: string,
    base_url: string,
    allow_sensitive: boolean,
  },
  telegram: {
    token: string,
    chatId: string,
  },
  discord: {
    token: string,
    channelId: string,
    guildId: string,
  },
}
