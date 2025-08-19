import { Alert, Loader, Paper, Stack, Title, Text, Image, Flex, Divider, useMantineTheme, Group, Button } from "@mantine/core"
import { memo, useEffect, useState } from "react";
import apiClient from "../util/axiosClient";
import type { AxiosResponse } from "axios";
import type { ThreadPreview } from "../util/types";
import { ThreadPreviewComponent } from "./ThreadPreview";


interface ApiResponse {
    data: ThreadPreview[];
    meta: any;
}

const _ThreadList = ( {slug} : {slug : string} ) => {
    const theme = useMantineTheme();

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



    let content;

    if (status === "loading" || status === "idle") {
        content = <Loader type="dots" />
    }

    if (status === "failed") {
        content = (
            <Alert title="error!" color="red">
                {error}
            </Alert>

        )
    }

    if (status === "succeeded") {
        console.log(threads)
        content = (
            <Stack pl="lg">
                {threads.map((thread) => (
                    <ThreadPreviewComponent thread={thread}/>
                ))}

            </Stack>

        )
    }

    return (<>
        {content}
    </>
    )

}

export const ThreadList = memo(_ThreadList);