import { Title, Text, Paper, Flex, Center, useMantineTheme, Divider, Space, useMantineColorScheme, Container } from '@mantine/core';
import classes from './Home.module.css'
import { Link } from 'react-router';
import { useAppDispatch, useAppSelector } from '../store';
import { useEffect } from 'react';
import { fetchBoards } from '../slices/boardsSlice';

export function Home() {

    const theme = useMantineTheme();
    const { colorScheme } = useMantineColorScheme();
    const dispatch = useAppDispatch();


    const { boards, status, error } = useAppSelector((state) => state.boards);

    useEffect(() => {
    
        if (status === 'idle') {
            dispatch(fetchBoards());
        }
    }, [status, dispatch]);

    let boardsContent;
    if (status === 'loading') {
        boardsContent = <Center> Loading... </Center>;
    }
    if (status === 'succeeded') {
        boardsContent = boards.map((board) => (
            <Text className={colorScheme === 'dark' ? classes.linkDark : classes.linkLight}
                key={board.id} component={Link}
                to={`/boards/${board.slug}`} c={theme.colors.linkColor[0]} >{board.name} </Text>
        ));

    }
    if (status === 'failed') {
        boardsContent = <Text c="red">{error}</Text>;
    }
    

    return (
        <Container size="lg" px="md" py="xl">
            <Paper radius={0} withBorder mah={"500px"} style={{ borderColor: theme.colors.borderCol[0] }} >

                <Title order={5} c={"textColor"} ta={'center'} >Boards</Title>
                <Space h="xs" />
                <Divider style={{ borderColor: theme.colors.borderCol[0] }} variant='dashed' />
                <Space h="xs" />
                <Flex style={{ width: "100%", gap: "20px", flexWrap: "wrap", justifyContent: "space-evenly", alignItems: "center" }}>
                    {boardsContent}
                </Flex>

            </Paper >
        </Container>
    );
}