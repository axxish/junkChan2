// src/components/ThreadPreview.tsx (or wherever it's located)
import { type Thread, type UserProfile } from "../util/types";

import { Text, Image, Title, Anchor, StatusText, Space } from "./Common";

import { PostView } from "./PostView";



export function ThreadPreviewComponent({ thread }: { thread: Thread }) {

  const { users } = thread;
  if (!thread) {
    return (<StatusText>whoops! this thread could not be loaded!</StatusText>);
  }
  let op: UserProfile = { username: "Anonymous", id: "anon", avatar_url: null, role: "anon" };

  if (thread.op.user_id !== null) {
    op = users[thread.op.user_id];
  }



  return (
    <>
      <PostView p={thread.op} u={op} action={{type:"View", post_id: thread.op.thread_id}}></PostView>
      {thread.latest_replies.map((reply) => {
        if (reply.user_id !== null) {
          return (<PostView key={reply.id} p={reply} u={users[reply.user_id]} isReply></PostView>);
        }
        return (<PostView key={reply.id} p={reply} isReply></PostView>)
      })}
      <Space></Space>
    </>
  );
}