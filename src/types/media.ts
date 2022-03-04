import type { Post } from "./instancePosts";

export interface Media {
  buffer: Buffer;
  mimeType: string;
  post: Post;
}
