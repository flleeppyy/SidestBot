module.exports = {
  options: {
    /* The text attached before the source. */
    status: "Example status",
    // status: "ny" + "a".repeat(Math.floor(Math.random() * 10) + 1),
    /* Example output: Status here (Source here) */
    includeSource: true,
    /* If this is enabled, status will be ignored. */
    enableQuotes: false,
    /* An array of different quotes, picked at random. */
    quotes: [
      "quote1",
      "quote2",
      "quote3",
      // ...
    ],
  },
  /* Enable/disable drivers. Make sure to fill in their configuration options for access tokens and keys. */
  enabled: {
    Twitter: false,
    Mastodon: false,
    Telegram: false,
    Discord: false
  },
  twitter: {
    consumer_key: "",
    consumer_secret: "",
    access_token_key: "",
    access_token_secret: "",
  },
  mastodon: {
    access_token: "",
    base_url: "",
    allow_sensitive: false,
  },
  telegram: {
    token: "",
    chatId: "",
  },
  discord: {
    token: "",
    channelId: "",
    guildId: ""
  }
};
