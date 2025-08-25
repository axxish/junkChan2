import { Anchor, Button, Center, Input, Paper, Space, Text } from "../components/Common";
import { Group, Stack } from "../components/FlexContainer";


export function LoginPage() {

    return (
        <Center>

            <Stack>
                <Space />
                <Paper>
                    <form>

                        <Group $justify="space-between">
                            <Input placeholder="Username or email"></Input>
                        </Group>
                        <Space />

                        <Group $justify="space-between">
                            <Input type="password" placeholder="Password"></Input>
                        </Group>
                        <Space />
                        <Center>
                            <Button type="submit"> Login </Button>
                        </Center>
                    </form>
                </Paper>
            </Stack>

        </Center>
    );

}