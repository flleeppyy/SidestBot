/**
 * @file src/utils/logger.ts
 * @description General logging utilities
 * @module utils/logger
 */

import pino from "pino";

export const logger = pino({
  name: "Picture-bot",
});
