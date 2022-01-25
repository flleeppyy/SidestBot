import Telegram from "node-telegram-bot-api";

export class TelegramDriver {
  public client: Telegram;
  constructor(private readonly token: string) {
    this.token = token;
    this.client = new Telegram(this.token);
  }

  async sendMessage(chatId: Telegram.ChatId, message: string): Promise<void> {
    await this.client.sendMessage(chatId, message);
  }

  async sendMedia(chatId: Telegram.ChatId, media: Buffer, options: Telegram.SendPhotoOptions): Promise<string> {
    const res = await this.client.sendPhoto(chatId, media, options);
    return res.message_id.toString();
  }
}
