/**
 * @file Logger
 * @description Handles console logging and transports
 * @module utils/logger
 */

import { pino } from "pino";
import pinoInspector from "pino-inspector";
import type { Config } from "../types/config";
import { ErrorReporter } from "./errorReporter";
const config = require("../../config") as Config;

/**
 * Creates a new pino logger
 */

const pinoOptions: pino.LoggerOptions = {
  transport: {
    target: "pino-pretty",
    options: {
      translateTime: "yyyy-mm-dd HH:MM:ss",
      colorize: true,
    },
  },
  prettifier: pinoInspector,
};

export const logger = pino(pinoOptions);

new ErrorReporter(config.errorReporting, logger);

logger.info("Logging started");
