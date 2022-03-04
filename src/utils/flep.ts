/**
 * @file src/utils/flep.ts
 * @description Flep logger - A no dependency logger
 * @module utils/flep
 */

import { EventEmitter } from "stream";

interface LoggerConfig {
  useDefaultColoring?: boolean;
  dontLog?: boolean;
}

interface Log {
  date: Date;
  msg: any | string;
  level: typeof Logger.prototype.levelColors[keyof typeof Logger.prototype.levelColors];
}

class Logger extends EventEmitter {
  levelColors: {
    [key: string]: string;
  } = {
      INFO: "#0FFFFB",
      WARN: "#FFED44",
      ERROR: "#FF182A",
    };

  config: LoggerConfig = {};

  logs: Log[] = [];

  constructor(config?: LoggerConfig) {
    super();
    if (config) {
      this.config = config;
    }
  }

  /**
   * @description Do not use
   */
  private _log(obj: any) {
    this.emit("log", obj);
    if (!this.config.dontLog) {
      this.logs.push({
        date: obj.date,
        msg: obj.msg,
        level: obj.level,
      });
    }

    const args = [
      `[${obj.date.toLocaleString().split(", ").join(" ")}] %c${obj.level}%c:`,
      `color: ${this.levelColors[obj.level]};`,
      "color: white;",
    ];

    args.push(...obj.msg);

    if (this.config.useDefaultColoring) {
      // @ts-expect-error
      console[obj.level.toLowerCase()].apply(this, args);
    } else {
      console.log.apply(this, args);
    }
  }

  info(...args: any) {
    this._log({
      date: new Date(),
      level: "INFO",
      msg: args,
    });
  }

  warn(...args: any) {
    this._log({
      date: new Date(),
      level: "WARN",
      msg: args,
    });
  }

  error(...args: any) {
    this._log({
      date: new Date(),
      level: "ERROR",
      msg: args,
    });
  }
}

export default Logger;
