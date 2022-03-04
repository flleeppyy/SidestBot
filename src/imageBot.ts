/**
 * @file src/imageBot.ts
 * @description Image Bot
 * @module imageBot
 */

/* eslint-disable @typescript-eslint/no-var-requires */
import axios, { AxiosError } from "axios";
import { existsSync } from "fs";
import { writeFile } from "fs/promises";
import { join as pathJoin } from "path";
import type { Config } from "types/config";
import { DiscordDriver, MastodonDriver, TelegramDriver, TwitterDriver } from "./drivers/drivers";
import type { InstanceConfig } from "./types/instanceConfig";
import type { Media } from "./types/media";
import type { MediaOptions } from "./types/mediaOptions";
import type { Post, postsJSON } from "./types/instancePosts";
import { NoDriversEnabledError, NoPostsError } from "./utils/errors";
import { logger } from "./utils/logger";
import { execSync } from "child_process";

const config: Config = require("../config");

export class ImageBot {
  instanceDir = "";
  config: InstanceConfig;
  logger: typeof logger;
  name: string;

  constructor(instanceDir: string) {
    if (!instanceDir) {
      throw new Error("No instance directory provided");
    }

    this.instanceDir = instanceDir;
    // get directory title

    this.name = instanceDir.split(pathJoin(__dirname, "../instances/")).pop() as string;
    console.log(this.name);
    this.config = require(pathJoin(instanceDir, "config.js"));
    this.logger = logger.child({
      hostname: this.name,
    });
  }

  async start(): Promise<any> {
    if (!existsSync(pathJoin(this.instanceDir, "posts.json"))) {
      throw new NoPostsError("posts.json not found");
    }

    // import posts and completed posts
    const posts: postsJSON = require(pathJoin(this.instanceDir, "posts.json"));

    if (posts.posts.length === 0) {
      if (posts.completedPosts.length > 0 && config.resetPostsWhenComplete) {
        this.logger.info("Resetting posts");
        try {
          execSync(`../cli/posts reset --instance ${this.name}`);
        } catch (e) {
          this.logger.error("An attempt was made to reset posts, but failed");
          this.logger.error(e);
        }
      }
      throw new NoPostsError("No posts found");
    }

    for (const driver of Object.keys(this.config.enabled)) {
      if (this.config.enabled[driver] && config.disabledDrivers.indexOf(driver.toLowerCase()) === -1) {
        this.logger.info(`${driver} driver enabled`);
      }
    }

    // check if all drivers are disabled
    if (Object.entries(this.config.enabled).filter(([, enabled]) => enabled).length === 0) {
      throw new NoDriversEnabledError("No drivers enabled");
    }

    let errorCounter = 0;
    const errorCounterLimit = 5;

    const getPost = async (): Promise<Media> => {
      // Pick a random post
      const post: Post = posts.posts[Math.floor(Math.random() * posts.posts.length)];

      let image;
      try {
        if (!post.file_url) {
          const err = new Error("No file_url found in post");
          this.logger.error("No file_url found in post " + post.id);
          err.name = "NoFileUrl";
          throw err;
        }
        const result = await axios.get<ArrayBuffer>(post.file_url, { responseType: "arraybuffer" });
        image = result.data;
        const mimeType = result.headers["content-type"].split(";")[0];
        return {
          post,
          buffer: Buffer.from(image),
          mimeType,
        };
      } catch (error) {
        const e = error as AxiosError;
        if (e.response?.status) {
          if (e?.response?.status === 404) {
            this.logger.error(`${post.url} not found`);
            return getPost();
          }

          if (e?.response?.status >= 500) {
            errorCounter++;
          }
          if (errorCounter >= errorCounterLimit) {
            throw new Error("Too many errors.");
          }
        } else if (e.name === "NoFileUrl") {
          // empty to continue.
        } else {
          throw new Error(`Error while fetching ${post.file_url}.\n` + error);
        }

        const queryOptions = {
          json: 1,
          page: "dapi",
          s: "post",
          q: "index",
          id: post.id,
          api_key: config.apiCredentials.gelbooru?.apiKey,
          user_id: config.apiCredentials.gelbooru?.userId,
        };

        const queryOptionsString = Object.entries(queryOptions)
          .map(([key, value]) => `${key}=${value}`)
          .join("&");
        const postInfo = await axios(`https://${posts.booru}/index.php?${queryOptionsString}`);
        if (!postInfo.data.post[0].file_url) {
          this.logger.warn(`Post ${post.id} not found, choosing another post`);
          posts.completedPosts.push({ failed: true, ...post });
          posts.posts.splice(posts.posts.indexOf(post), 1);
          return await getPost();
        }

        const result = await axios.get<ArrayBuffer>(postInfo.data.post[0].file_url, { responseType: "arraybuffer" });
        image = result.data;
        return {
          post,
          buffer: Buffer.from(image),
          mimeType: result.headers["content-type"].split(";")[0],
        };
      }
    };

    const media = await getPost();

    const status = `${this.config.options.status} 󠀭󠀠󠁓󠁩󠁤󠁥󠁳󠁴󠁂󠁯󠁴󠀠${this.config.options.includeSource ? `(${media.post.url})` : ""}`;

    const mediaOptions: MediaOptions = {
      text: status,
      sensitive: media.post.rating !== "s",
    };

    const instanceInfo = {
      name: this.name,
      instanceDir: this.instanceDir,
    };

    const promises: Promise<void>[] = [];

    if (this.config.enabled?.Twitter && config.disabledDrivers.indexOf("Twitter".toLowerCase()) === -1) {
      promises.push(
        new Promise((resolve, reject) => {
          try {
            const twitter = new TwitterDriver(this.config.twitter, instanceInfo);
            twitter.sendMedia(media, mediaOptions).then(() => {
              resolve();
            });
          } catch (e) {
            this.logger.error(e);
            reject(e);
          }
        }),
      );
    }

    if (this.config.enabled?.Mastodon && config.disabledDrivers.indexOf("Mastodon".toLowerCase()) === -1) {
      promises.push(
        new Promise((resolve, reject) => {
          try {
            const mastodon = new MastodonDriver(this.config.mastodon, instanceInfo);
            if (!this.config.mastodon.allow_sensitive && media.post.rating !== "s") {
              this.logger.warn("Sensitive post detected, skipping Mastodon");
            } else {
              mastodon.init().then(() => {
                mastodon.sendMedia(media, mediaOptions).then(() => {
                  resolve();
                });
              });
            }
          } catch (e) {
            this.logger.error(e, "Failed to send to Mastodon");
            reject(e);
          }
        }),
      );
    }

    if (this.config.enabled?.Telegram && config.disabledDrivers.indexOf("Telegram".toLowerCase()) === -1) {
      promises.push(
        new Promise((resolve, reject) => {
          try {
            const telegram = new TelegramDriver(this.config.telegram, instanceInfo);
            telegram.sendMedia(media, mediaOptions).then(() => {
              resolve();
            });
          } catch (e) {
            this.logger.error(e, "Failed to send to Telegram");
            reject(e);
          }
        }),
      );
    }

    if (this.config.enabled?.Discord && config.disabledDrivers.indexOf("Discord".toLowerCase()) === -1) {
      promises.push(
        new Promise((resolve, reject) => {
          try {
            const discord = new DiscordDriver(this.config.discord, instanceInfo);
            discord.init().then(() => {
              discord.sendMedia(media, mediaOptions).then(() => {
                resolve();
              });
            });
          } catch (e) {
            this.logger.error(e, "Failed to send to Discord");
            reject(e);
          }
        }),
      );
    }

    await Promise.all(promises).catch((e) => {
      this.logger.error(e);
    });
    this.logger.info("All drivers sent");

    posts.completedPosts.push({
      ...media.post,
    });

    await writeFile(
      pathJoin(this.instanceDir, "posts.json"),
      JSON.stringify({
        posts: posts.posts,
        completedPosts: posts.completedPosts,
      }),
    );
  }
}
