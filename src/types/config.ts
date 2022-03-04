export interface Config {
  disabledDrivers: string[],
  disabledInstances: string[],
  apiCredentials: {
    gelbooru?: {
      apiKey: string
      userId: string
    },
  },
  resetPostsWhenComplete: boolean,
  errorReporting: {
    enabled: {
      telegram: boolean,
      discord: boolean,
    },
    telegram: {
      token: string,
      chatId: string,
    },
    discord: {
      token: string,
      guildId: string,
      channelId: string,
    },
  },
}
