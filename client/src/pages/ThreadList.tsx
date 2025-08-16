import { Alert, Loader, Paper, Stack, Title, Text, Image, Flex, Divider, useMantineTheme, Group } from "@mantine/core"
import { memo, useEffect, useState } from "react";
import apiClient from "../util/axiosClient";
import type { AxiosResponse } from "axios";

interface ThreadListProps {
    slug: string
}

interface ApiResponse {
    data: ThreadPreview[];
    meta: any;
}
export interface ThreadPreview {
    id: number;
    board_id: number;
    thread_id: number;
    user_id: string | null; // Can be null for anonymous posters
    comment: string;
    poster_ip: string; // TODO: Change this on the serverside, both locally and on the remote instance
    created_at: string;
    board_post_id: number;
    reply_count: number;
    image_reply_count: number;
    image_url: string;
}

const _ThreadList = ({ slug }: ThreadListProps) => {
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
        content = <Loader />
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
                    <div>
                       
                        <Stack>
                            <Group>
                                <Text>{(thread.user_id===null) ? <>Anonymous</> : <>{thread.user_id}</>}</Text>
                            </Group>
                            <Flex gap="sm">
                                <Image maw={"100px"} src={thread.image_url}></Image>
                                <Text>{thread.comment}</Text>
                            </Flex>
                        </Stack>
                        <Divider style={{ borderColor: theme.colors.borderCol[0] }} my="lg" variant='dashed' />
                    </div>
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