/**
 * @file src/utils/errors.ts
 * @description Errors
 * @module utils/errors
 */

export class NoDriversEnabledError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "NoDriversEnabledError";
  }
}

export class NoPostsError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "NoPostsError";
  }
}

export class MissingDirectoryError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "MissingDirectoryError";
  }
}
