
export interface Board {
  id: number;
  slug: string;
  name: string;
  description: string;
  created_at: string;
}
export interface UserProfile {
  id: string; // UUID
  username: string | null;
  avatar_url: string | null;
  role: string | null;
}




export interface Thread {
  op: Post;
  reply_count: number;
  image_reply_count: number;
       
  // Enriched preview data from the API:
  latest_replies: Reply[]; 
  users: Record<string, UserProfile>;           
}


export interface Post {
  id: number;
  board_id: number;
  thread_id: number;
  board_post_id: number;
  user_id: string | null;
  comment: string | null;
  created_at: string;
  subject: string | null; // Will be null for replies
  image_url?: string;      // Optional for replies
}


export interface Reply extends Post {
  backlinks: number[]; // An array of board_post_ids that have replied to this reply
}

/**
 * Represents the entire data structure for a single thread view,
 * as returned by `GET /functions/v1/post/{id}`.
 */
export interface FullThread {
  op: Post;
  replies: Reply[];
  totalReplyCount: number;
  users: Record<string, UserProfile>;
}

export interface PostViewAction{
  type: 'View' | 'Reply';
  post_id: number;
};