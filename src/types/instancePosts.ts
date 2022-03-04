export interface Post {
  id: string;
  url: string;
  file_url: string;
  tags?: string[];
  source?: string;
  rating?: string;
}

interface completedPost extends Post {
  failed?: boolean;
}

export interface postsJSON {
  posts: Post[];
  completedPosts: completedPost[];
  booru: string;
}