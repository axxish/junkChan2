
export interface Board {
  id: number;
  slug: string;
  name: string;
  description: string;
  created_at: string;
}

export interface ThreadPreview {
  id: number;
  board_id: number;
  thread_id: number;
  user_id: string | null; // Can be null for anonymous posters
  comment: string;
  poster_ip: string; // Note: Be careful about exposing this in the final UI
  created_at: string;
  board_post_id: number;
  reply_count: number;
  image_reply_count: number;
  image_url: string;
}