/**
 * @file src/utils/errorReporter.ts
 * @description Error Reporter
 * @module utils/errorReporter
 */
/* eslint-disable prefer-spread */
import Discord from "discord.js";
import TelegramBot from "node-telegram-bot-api";
import type pino from "pino";
import type { Config } from "types/config";
export class ErrorReporter {
  private discord?: Discord.Client;
  private telegram?: TelegramBot;
  private config: Config["errorReporting"];
  private logger: pino.Logger;

  constructor(config: Config["errorReporting"], logger: pino.Logger) {
    if (config.enabled.discord) {
      this.discord = new Discord.Client({
        intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.DIRECT_MESSAGES],
      });
      this.discord.login(config.discord.token);
      this.discord.on("ready", () => {
        this.logger.info("Discord error reporting ready");
      });
    }

    if (config.enabled.telegram) {
      this.telegram = new TelegramBot(config.telegram.token, {
        polling: false,
      });
    }

    logger._error = logger.error;
    logger.error = (...args: any) => {
      logger._error.apply(logger, args);
      this.report(...args);
    };

    this.config = config;
    this.logger = logger;
  }

  async report(...args: any): Promise<void> {
    if (this.discord) {
      this.reportDiscord(args[0], args[1]);
    }

    if (this.telegram) {
      this.reportTelegram(args[0], args[1]);
    }
  }

  private async reportDiscord(message: string, error: any): Promise<void> {
    if (!this.discord) {
      return;
    }

    const guild = this.discord.guilds.cache.get(this.config.discord.guildId);
    if (!guild) {
      this.logger._error("Could not report to discord\n" + error);
      return;
    }

    const channel = guild.channels.cache.get(this.config.discord.channelId) as Discord.TextChannel;
    if (!channel) {
      this.logger._error("Could not report to discord\n" + error);
      return;
    }

    const embed = new Discord.MessageEmbed().addField("Error message", message).addField("Error", error).setColor("#ff0000");

    channel.send({
      embeds: [embed],
    });
  }

  private async reportTelegram(message: any, error: Error): Promise<void> {
    try {
      if (!this.telegram) {
        this.logger.warn("Telegram not exist error logger");
        return;
      }

      const chatId = this.config.telegram.chatId;
      if (!chatId) {
        this.logger._error("Could not report to Telegram\n" + error.stack);
        return;
      }

      let errormessage: string;

      console.log("erroreport");
      try {
        errormessage = JSON.stringify(message);
      } catch {
        errormessage = message.toString() || message;
      }
      const messageText = `**Error message:**\n${errormessage}\n\n**Error:**\n${error?.message}\n\n**Stack trace:**\n${error?.stack}`;
      this.telegram.sendMessage(chatId, messageText);
    } catch {
      // oh jesus christ.

    }
  }

}
