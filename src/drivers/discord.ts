/**
 * @file src/drivers/discord.ts
 * @description Discord bot driver
 * @module drivers/discord
 */

import { Client, Intents, TextChannel } from "discord.js";
import type { InstanceInfo } from "types/instanceInfo";
import type { InstanceConfig } from "../types/instanceConfig";
import type { Media } from "../types/media";
import type { MediaOptions } from "../types/mediaOptions";

export class DiscordDriver {
  public client: Client;
  private instance: InstanceInfo;
  private config: InstanceConfig["discord"];
  private static maxBytes = 1024 * 1024 * 8;

  constructor(config: InstanceConfig["discord"], instance: InstanceInfo) {
    this.config = config;
    this.client = new Client({
      intents: [Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILDS],
    });
    this.instance = instance;
  }

  async init() {
    await this.client.login(this.config.token);
  }

  public async sendMedia(post: Media, options: MediaOptions) {
    const channel = this.client.channels.cache.get(this.config.channelId) as TextChannel;
    if (!channel) {
      throw new Error("Could not find channel");
    }

    const file = post.buffer;

    if (file.length > DiscordDriver.maxBytes) {
      throw new Error("File too large");
    }

    const res = await channel.send({
      content: options.text,
      files: [
        {
          attachment: file,
          spoiler: options.sensitive,
        },
      ],
    });

    return res.id;
  }
}
