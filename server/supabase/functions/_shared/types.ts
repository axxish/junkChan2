
export interface Thread {
  id: number;
  board_id: number;
  thread_id: number;
  board_post_id: number;
  user_id: string | null;
  image_path: string; // OPs always have an image path from the DB
  comment: string | null;
  created_at: string;
  reply_count: number;
  image_reply_count: number;
  image_url?: string; // This will be added by the Edge Function
}

/**
 * Represents a single post (OP or Reply) within a full thread view.
 */
export interface Post {
  id: number;
  board_id: number;
  thread_id: number;
  board_post_id: number;
  user_id: string | null;
  image_path: string | null; // Can be null for text replies
  comment: string | null;
  created_at: string;
  image_url?: string; // This will be added by the Edge Function
}

/**
 * Represents a Reply post, which includes backlinks.
 */
export interface Reply extends Post {
  backlinks: number[];
}

/**

 * The full structure returned by the `get_thread_by_id` database function.
 */
export interface FullThread {
  op: Post;
  replies: Reply[];
  totalReplyCount: number;
}