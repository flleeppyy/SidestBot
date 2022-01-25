import { AccountCredentials, CreateStatusParams, login, MastoClient } from "masto";

const STRING_UNINIT = "Mastodon client not initialized";
export class MastodonDriver {
  public client?: MastoClient;
  constructor(private readonly access_token: string, private readonly base_url: string) {
    this.access_token = access_token;
    this.base_url = base_url;
  }

  async init() {
    this.client = await login({
      url: this.base_url,
      accessToken: this.access_token,
    });
    return this;
  }
  async toot(message: string, options: CreateStatusParams): Promise<string> {
    if (this.client == null) {
      throw new Error(STRING_UNINIT);
    }
    const res = await this.client.statuses.create({
      status: message,
      ...options,
    });

    return res.id;
  }

  async verifyCredentials(): Promise<AccountCredentials> {
    if (this.client == null) {
      throw new Error(STRING_UNINIT);
    }
    let res;
    try {
      res = await this.client.accounts.verifyCredentials();
    } catch (error) {
      throw new Error("Failed to verify credentials");
    }
    return res;
  }

  async tootMedia(media: Buffer, options: CreateStatusParams): Promise<string> {
    if (this.client == null) {
      throw new Error(STRING_UNINIT);
    }
    const attachment = await this.client.mediaAttachments.create({
      file: media,
    });

    const res = await this.client.statuses.create({
      status: options.status,
      mediaIds: [attachment.id],
      visibility: options.visibility,
      sensitive: options.sensitive,
    });

    return res.id;
  }
}
