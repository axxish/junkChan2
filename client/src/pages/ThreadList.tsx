// src/components/ThreadList.tsx
import { memo, useEffect, useState } from "react";
import apiClient from "../util/axiosClient";
import type { Thread } from "../util/types";
import { ThreadPreviewComponent } from "../components/ThreadPreview";
import { FlexContainer } from "../components/FlexContainer";
import { Divider, StatusText, ErrorBox, Space, Center, PageTitle } from "../components/Common";
import { useParams } from "react-router";

interface ApiResponse {
  data: Thread[];
  meta: any;
}


const _ThreadList = () => {
  const { slug } = useParams<{ slug: string }>();
  const [threads, setThreads] = useState<Thread[]>([]);
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
      <>
        <Space />
        <Center $width="100%">
          <PageTitle>/{slug}/</PageTitle>

        </Center>
        <Space />
        <Divider />

        <FlexContainer $p="0" style={{ margin: "0" }} $direction="column" $justify="flex-start" $align="flex-start">
          {threads.map((thread) => (<div key={thread.op.id} style={{ width: "100%" }}>
            <ThreadPreviewComponent thread={thread} />
            <Divider />
          </div>
          ))}
        </FlexContainer>

      </>
    );
  }

  // Fallback return null if status is in an unexpected state
  return null;
};

export const ThreadList = memo(_ThreadList);