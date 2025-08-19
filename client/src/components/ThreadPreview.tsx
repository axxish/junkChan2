
import { Group, Stack, Text, Image, Flex, Divider, useMantineTheme } from "@mantine/core";
import { type ThreadPreview, type UserProfile } from "../util/types";

export function ThreadPreviewComponent({ thread }: { thread: ThreadPreview }) {
    const theme = useMantineTheme();
    const users = thread.users;    

    console.log(users);
    console.log(thread.user_id); 

    let op = users.find((user) =>user.id===thread.user_id);
    console.log(op);
    if(!op){
        op = {id: "null", username: "Anonymous", avatar_url: "", role: "USER" };
    }

    return (<div key={thread.id}>

        <Stack> 
            <Group>
                <Text>{op.username}</Text>
            </Group>
            <Flex gap="sm">
                <Image maw={"200px"} src={thread.image_url}></Image>
                <Text>{thread.comment}</Text>
            </Flex>
        </Stack>
        <Divider style={{ borderColor: theme.colors.borderCol[0] }} my="lg" variant='dashed' />
    </div>
    )
}