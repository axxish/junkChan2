// src/components/ThreadList.tsx
import { memo, useEffect, useState } from "react";
import apiClient from "../util/axiosClient";
import type { ThreadPreview } from "../util/types";
import { ThreadPreviewComponent } from "./ThreadPreview";

// Import our new styled components
import {
  AlertBox,
  AlertTitle,
  LoadingIndicator,
  ThreadsContainer,
} from "./ThreadList.styled";

interface ApiResponse {
  data: ThreadPreview[];
  meta: any;
}

const _ThreadList = ({ slug }: { slug: string }) => {
  const [threads, setThreads] = useState<ThreadPreview[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'succeeded' | 'failed'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchThreadData = async () => {
      setStatus('loading');
      setError(null);
      try {
        const response = await apiClient.get<ApiResponse>(
          `/functions/v1/board-threads/${slug}?page=1&limit=3`
        );
        setThreads(response.data.data);
        setStatus('succeeded');
      } catch (err: any) {
        setError(err.message || 'Failed to fetch threads.');
        setStatus('failed');
      }
    };

    fetchThreadData();
  }, [slug]);

  if (status === "loading" || status === "idle") {
    return <LoadingIndicator>Loading...</LoadingIndicator>;
  }

  if (status === "failed") {
    return (
      <AlertBox>
        <AlertTitle>Error!</AlertTitle>
        {error}
      </AlertBox>
    );
  }

  if (status === "succeeded") {
    return (
      <ThreadsContainer>
        {threads.map((thread) => (
          <ThreadPreviewComponent key={thread.id} thread={thread} />
        ))}
      </ThreadsContainer>
    );
  }

  // Fallback return null if status is in an unexpected state
  return null;
};

export const ThreadList = memo(_ThreadList);