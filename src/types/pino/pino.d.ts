import * as pino from "pino";

declare module "pino" {
  export namespace pino {
    interface BaseLogger {
      _error(...args: any[]): void;
    }
  }
}
