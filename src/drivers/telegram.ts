/**
 * @file src/drivers/telegram.ts
 * @description Telegram driver
 * @module drivers/telegram
 */

import Telegram from "node-telegram-bot-api";
import type { InstanceInfo } from "types/instanceInfo";
import type { InstanceConfig } from "../types/instanceConfig";
import type { Media } from "../types/media";
import type { MediaOptions } from "../types/mediaOptions";

export class TelegramDriver {
  public client: Telegram;
  private config: InstanceConfig["telegram"];
  private instance: InstanceInfo;

  constructor(config: InstanceConfig["telegram"], instance: InstanceInfo) {
    this.client = new Telegram(config.token);
    this.config = config;
    this.instance = instance;
  }

  async sendMessage(chatId: Telegram.ChatId, message: string): Promise<void> {
    await this.client.sendMessage(chatId, message);
  }

  async sendMedia(media: Media, options: MediaOptions): Promise<string> {
    let res: Telegram.Message;
    // get type of media
    const type = media.mimeType.split("/")[0];

    if (type === "image") {
      res = await this.client.sendPhoto(
        this.config.chatId,
        media.buffer,
        {
          caption: options.text,
        },
        // @ts-expect-error
        {
          filename: media.post.id + ".mp4",
          contentType: media.mimeType,
        },
      );
    } else if (type === "video") {
      res = await this.client.sendVideo(
        this.config.chatId,
        media.buffer,
        {
          caption: options.text,
        },
        // @ts-expect-error
        {
          filename: media.post.id + ".mp4",
          contentType: media.mimeType,
        },
      );
    } else {
      throw new Error(`Unsupported media type: ${type}`);
    }

    return res.message_id.toString();
  }
}
