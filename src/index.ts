import { logger } from "utils/logger";
import { config } from "config";
import { MastodonDriver, TwitterDriver, TelegramDriver } from "drivers/drivers";
import { existsSync, writeFileSync } from "fs";
import { join  as pathJoin} from "path";
import axios, {AxiosError} from "axios";

async function start() {
  logger.info("Starting Picture-bot");
  
  if (!existsSync(pathJoin(__dirname, "posts.json"))) {
    logger.error("posts.json not found. Please refer to the readme");
    process.exit(1);
  } 
  
  // import posts and completed posts
  // @ts-expect-error
  import { posts, completedPosts } from "./posts.json";
  
  
  if (posts.length === 0) {
    logger.error("No posts found in posts.json. Please refer to the readme to add posts");
    process.exit(1);
  }
  
  for (const driver of Object.keys(config.enabled)) {
    // @ts-expect-error fuck off
    if (config.enabled[driver]) {
      logger.info(`${driver} driver enabled`);
    }
  }
  
  // check if all drivers are disabled
  if (Object.entries(config.enabled).filter(([, enabled]) => enabled).length === 0) {
    logger.error("No drivers enabled");
    process.exit(1);
  }
  
  let errorCounter = 0;
  let errorCounterLimit = 5;
  
  async function getPost(): Promise<{
    post: any;
    buffer: Buffer;
  }> {
    // Pick a random post
    const post = posts[Math.floor(Math.random() * posts.length)];

    let image;
    try {
      const result = await axios.get<ArrayBuffer>(post.url, { responseType: "arraybuffer" });
      image = result.data;
      return { post, buffer: Buffer.from(image) };
    } catch (error) {
      const e = error as AxiosError;
      if (e.response?.status) {
        if (e?.response?.status === 404) {
          logger.error(`${post.url} not found`);
          return getPost();
        } 
  
        if (e?.response?.status >= 500) {
          errorCounter++;
        }
        if (errorCounter >= errorCounterLimit) {
          logger.error(`Too many errors. Exiting`);
          process.exit(1);
        }   
      } else {
        logger.error(error, `Error while fetching ${post.url}.`);
        process.exit(1);
      }

      const queryOptions = {
        json: 1,
        page: "dapi",
        s: "post",
        q: "index",
        id: post.id,
        api_key: config.gelbooru.api_key ? config.gelbooru.api_key : undefined,
        user_id: config.gelbooru.user_id ? config.gelbooru.user_id : undefined,
      };
      const queryOptionsString = Object.entries(queryOptions)
        .map(([key, value]) => `${key}=${value}`)
        .join("&");
      const postInfo = await axios(`https://gelbooru.com/index.php?${queryOptionsString}`);
      if (!postInfo.data.post[0].file_url) {
        logger.warn(`Post ${post.id} not found, choosing another post`);
        completedPosts.push({failed: true, ...post});
        posts.splice(posts.indexOf(post), 1);
        return await getPost();
      }

      const result = await axios.get<ArrayBuffer>(postInfo.data.post[0].file_url, { responseType: "arraybuffer" });
      image = result.data;
      return {
        post,
        buffer: Buffer.from(image),
      };
    }
  }

  const postBuffer = await getPost();

  let status;

  if (config.options.includeSource) {
    status = config.options.status + `(${post.})`;
  if (config.enabled.Twitter) {
    try {
      const twitter = new TwitterDriver(config.twitter.consumer_key, config.twitter.consumer_secret);
      twitter.sendMedia(postBuffer, {
        text: status,
      });
    } catch (e) {
      logger.error(e);
    }
  }

  if (config.enabled.Mastodon) {
    try {
      const mastodon = new MastodonDriver(config.mastodon.access_token, config.mastodon.base_url);
      mastodon.sendMedia(postBuffer, {
        status: status,
      });
    } catch (e) {
      logger.error(e, "Failed to send to Mastodon");
    }
  }

  if (config.enabled.Telegram) {
    try {
      const telegram = new TelegramDriver(config.telegram.token);
      telegram.sendMedia(config.telegram.chatId, postBuffer, {
        caption: status,
      });
    } catch (e) {
      logger.error(e, "Failed to send to Telegram");
    }
  }
  

  
}

start();