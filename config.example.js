module.exports = {
  disabledInstances: [],
  disabledDrivers: [
    // "telegram",
    // "discord",
    // "mastodon",
    // "twitter",
  ],
  apiCredentials: {
    gelbooru: {
      api_key: "",
      user_id: "",
    },
  },
  // This option means to essentially clear posts.json, and start from scratch, as if you just fetched all your posts.
  resetPostsWhenComplete: true,
  // Error reporting
  // Report errors to select services
  errorReporting: {
    enabled: {
      telegram: false,
      discord: false,
    },
    telegram: {
      token: "",
      chatId: "",
    },
    discord: {
      token: "",
      guildId: "",
      channelId: "",
    },
  }
};