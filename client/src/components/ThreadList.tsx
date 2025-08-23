// src/components/ThreadList.tsx
import { memo, useEffect, useState } from "react";
import apiClient from "../util/axiosClient";
import type { ThreadPreview } from "../util/types";
import { ThreadPreviewComponent } from "./ThreadPreview";
import { FlexContainer } from "./FlexContainer";
import { Divider, StatusText, ErrorBox } from "./Common";

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
    return <StatusText>Loading...</StatusText>;
  }

  if (status === "failed") {
    return (
      <ErrorBox>
        <StatusText>Error!</StatusText>
        {error}
      </ErrorBox>
    );
  }

  if (status === "succeeded") {
    return (

      <FlexContainer $p="0" style={{ margin: "0" }} $direction="column" $justify="flex-start" $align="flex-start">
        {threads.map((thread) => (<div key={thread.id} style={{width:"100%"}}>
          <ThreadPreviewComponent thread={thread} />
          <Divider />
        </div>
        ))}
      </FlexContainer>


    );
  }

  // Fallback return null if status is in an unexpected state
  return null;
};

export const ThreadList = memo(_ThreadList);