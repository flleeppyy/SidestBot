/**
 * @file src/drivers/twitter.ts
 * @description Twitter driver
 * @module drivers/twitter
 */

import Twitter from "twitter-lite";
import type { InstanceInfo } from "types/instanceInfo";
import type { MediaOptions } from "types/mediaOptions";
import type { InstanceConfig } from "../types/instanceConfig";
import type { Media } from "../types/media";

export class TwitterDriver {
  public client: Twitter;
  public uploadClient: Twitter;
  private instance: InstanceInfo;

  private config: InstanceConfig["twitter"] = {} as InstanceConfig["twitter"];

  constructor(config: InstanceConfig["twitter"], instance: InstanceInfo) {
    this.config.consumer_key = config.consumer_key;
    this.config.consumer_secret = config.consumer_secret;
    this.config.access_token_key = config.access_token_key;
    this.config.access_token_secret = config.access_token_secret;

    this.client = this.newClient();
    this.instance = instance;
    this.uploadClient = this.newClient("upload");
  }

  private newClient(subdomain = "api") {
    return new Twitter({
      subdomain,
      version: "1.1",
      consumer_key: this.config.consumer_key,
      consumer_secret: this.config.consumer_secret,
      access_token_key: this.config.access_token_key,
      access_token_secret: this.config.access_token_secret,
    });
  }

  async tweet(message: string): Promise<void> {
    await this.client.post("statuses/update", { status: message });
  }

  async sendMedia(media: Media, options: MediaOptions): Promise<string> {
    const initUpload = await this.uploadClient.post("media/upload", {
      command: "INIT",
      total_bytes: media.buffer.length,
      media_type: media.mimeType,
    });

    const media_id_string = initUpload.media_id_string;

    // Split buffer into chunks of 32000 bytes
    let chunkLength = 32000;
    let chunks = await this.getChunks(media.buffer, chunkLength);

    // If there's more than 999 chunks, recall the chunk function adding 32000 bytes until there are equal to or less than 999 chunks
    while (chunks.length > 999) {
      chunkLength += 32000;
      chunks = await this.getChunks(media.buffer, chunkLength);
    }

    // Upload each chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      await this.uploadClient.post("media/upload", {
        command: "APPEND",
        media_id: media_id_string,
        media_data: chunk.toString("base64"),
        segment_index: i,
      });
    }

    // Finalize the upload
    await this.uploadClient.post("media/upload", {
      command: "FINALIZE",
      media_id: media_id_string,
    });

    const tweet_id = await this.client.post("statuses/update", {
      status: options.text,
      media_ids: [media_id_string],
    });

    return tweet_id.id_str;
  }

  async getChunks(buffer: Buffer, chunkSize: number): Promise<Buffer[]> {
    const chunks = [];

    for (let i = 0; i < buffer.length; i += chunkSize) {
      chunks.push(buffer.slice(i, i + chunkSize));
    }

    return chunks;
  }
}
