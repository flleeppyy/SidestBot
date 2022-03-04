/**
 * @file src/drivers/mastodon.ts
 * @description Mastodon driver
 * @module drivers/mastodon
 */

import axios from "axios";
import FormData from "form-data";
import { AccountCredentials, CreateStatusParams, MastoClient, login } from "masto";
import type { InstanceInfo } from "types/instanceInfo";
import type { InstanceConfig } from "../types/instanceConfig";
import type { Media } from "../types/media";
import type { MediaOptions } from "../types/mediaOptions";

const STRING_UNINIT = "Mastodon client not initialized";
export class MastodonDriver {
  public client: MastoClient | null;
  private config: InstanceConfig["mastodon"];
  private instance: InstanceInfo;

  constructor(config: InstanceConfig["mastodon"], instance: InstanceInfo) {
    this.config = config;
    this.instance = instance;
    this.client = null;
  }

  async init() {
    this.client = await login({
      url: this.config.base_url,
      accessToken: this.config.access_token,
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

  async sendMedia(post: Media, options: MediaOptions): Promise<string> {
    if (this.client == null) {
      throw new Error(STRING_UNINIT);
    }
    let attachment;
    try {
      // attachment = await this.client.mediaAttachments.create({
      //   file: bufferToStream(post.buffer),
      // });
      const form = new FormData();
      form.append("file", post.buffer, {
        filename: post.post.file_url.split("/").pop(),
        contentType: post.mimeType,
      });
      attachment = await axios.post(this.config.base_url + "/api/v2/media", form.getBuffer(), {
        // "responseType": "json",
        headers: {
          // "Authorization": "Bearer HbgAUCDiPhWd6pXW7jFPbcEA8ONCh8j74jGaW4bsEX0",
          Authorization: `Bearer ${this.config.access_token}`,
          ...form.getHeaders(),
        },
      });

      attachment = await this.client.mediaAttachments.waitFor(attachment.data.id, 500);
    } catch (error) {
      throw new Error("Failed to upload media" + error);
    }

    const res = await this.client.statuses.create({
      status: options.text,
      mediaIds: [attachment.id],
      visibility: "public",
      sensitive: options.sensitive,
    });

    return res.id;
  }
}
