

export interface UserProfile {
  id: string; // UUID
  username: string | null;
  avatar_url: string | null;
  role: string | null;
}


export interface ReplyPreview {
  id: number;
  board_post_id: number;
  comment: string | null;
  created_at: string;
  image_path: string | null;
  user_id: string | null;
  image_url?: string; // Will be added by the Edge Function
}



export interface Thread{
  op: Post; // The OP is now a nested object of type Post
  reply_count: number;
  image_reply_count: number;
  latest_replies: ReplyPreview[];
  users: Record<string, UserProfile>;
}

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

export interface FullThread {
  op: Post;
  replies: Reply[];
  totalReplyCount: number;
  users: UserProfile[]; // Add this new property
}