import { useEffect, useState } from "react";
import { useParams } from "react-router";
import apiClient from "../util/axiosClient";
import type { FullThread, UserProfile } from "../util/types";
import { Space, StatusText } from "../components/Common";
import { PostView } from "../components/PostView";


export function ThreadView() {
    const { id } = useParams<{ id: string }>();
    const [status, setStatus] = useState<'idle' | 'loading' | 'succeeded' | 'failed'>('idle');
    const [error, setError] = useState<string | null>(null);
    const [posts, setPosts] = useState<FullThread | null>(null);

    useEffect(() => {
        const fetchThreadData = async () => {
            setStatus('loading');
            setError(null);
            try {
                const response = await apiClient.get<FullThread>(
                    `/functions/v1/posts/${id}`
                );
                setPosts(response.data);
                setStatus('succeeded');

            } catch (err: any) {
                setError(err.message || 'Failed to fetch threads.');
                setStatus('failed');
            }
        };

        fetchThreadData();
    }, [id]);




    if (status === "loading" || status === "idle") {
        return (<StatusText>Loading...</StatusText>)
    }

    if (!posts || status === "failed") {
        return (<StatusText>Whoops! Error loading this thread! {error} </StatusText>);
    }
    const { users } = posts;

    let op: UserProfile = { username: "Anonymous", id: "anon", avatar_url: null, role: "anon" };
    
      if (posts.op.user_id !== null) {
        op = users[posts.op.user_id];
      }

    return (<>
        <PostView p={posts.op} u={op} action={{ type: "Reply", post_id: posts.op.thread_id }}></PostView>
        {posts.replies.map((reply) => {
            if (reply.user_id !== null) {
                return (<PostView key={reply.id} p={reply} u={users[reply.user_id]} action={{ type: "Reply", post_id: reply.id }} isReply></PostView>);
            }
            return (<PostView key={reply.id} p={reply} action={{ type: "Reply", post_id: reply.id }}     isReply></PostView>)
        })}
        <Space></Space>
    </>);
}