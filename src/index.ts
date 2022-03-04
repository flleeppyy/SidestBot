/**
 * @file src/index.ts
 * @description Entry point
 * @module index
 */

import { existsSync, readdirSync } from "fs";
import path from "path";
import { ImageBot } from "./imageBot";
import { logger } from "./utils/logger";
const config = require("../config");

const instancesDir = path.join(__dirname, "../instances");

const instances = readdirSync(instancesDir).filter((e) => e !== "instance_example");

instances.forEach(async (instance) => {
  if (config.disabledInstances.includes(instance)) {
    logger.info(`${instance} disabled`);
    return;
  }
  const instanceDir = path.join(instancesDir, instance);
  if (!existsSync(path.join(instanceDir, "config.js"))) {
    logger.warn(`${instance} has no config.js`);
    return;
  }
  try {
    const imageBot = new ImageBot(instanceDir);
    imageBot.start().catch((e) => {
      logger
        .child({
          hostname: instance,
        })
        .error(e);
      setTimeout(() => console.log(), 500000);
    });
  } catch (e) {
    logger
      .child({
        hostname: instance,
      })
      .error(e);
    setTimeout(() => console.log(), 500000);
  }
});

process.on("unhandledRejection", (err) => {
  logger.error(err);
});

process.on("uncaughtExceptioan", (err) => {
  logger.error(err);
});
