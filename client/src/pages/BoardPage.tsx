import { Link, Route, Routes, useParams } from "react-router";
import { useAppDispatch } from '../store'
import { useAppSelector } from "../store";
import { Page404 } from "./Page404";
import { useEffect } from "react";
import { fetchBoards } from "../slices/boardsSlice";
import { ActionIcon, AppShell,  Center, Divider, Loader,  Space, Title, useMantineTheme } from "@mantine/core";
import { IconHome } from "@tabler/icons-react";
import { ThreadList } from "./ThreadList";
import { useDisclosure } from "@mantine/hooks";

export function BoardPage() {
    const theme = useMantineTheme();

    const { slug } = useParams<{ slug: string }>();

    const { boards, status } = useAppSelector((state) => state.boards);
    const currentBoard = boards.find(board => board.slug === slug);
    const dispatch = useAppDispatch();

    useEffect(() => {
        if (status === 'idle') {
            dispatch(fetchBoards());
        }
    }, [status, dispatch]);


    if (status === 'loading' || status === 'idle') {
        return <Center><Loader /></Center>;
    }

    if (!currentBoard) {
        return (<Page404 />)
    }
    return (
        <AppShell style={{borderColor: theme.colors.borderCol[0]}} navbar={{width:45, breakpoint:"sm", collapsed: { mobile: true },}}>
            <AppShell.Navbar  style={{borderColor: theme.colors.borderCol[0]}}>
                
                <ActionIcon size={"xl"} radius={"0"} component={Link} to={"/"}>
                    <IconHome></IconHome>
                </ActionIcon>
            </AppShell.Navbar>
            <AppShell.Main >
                
                <Space h={"lg"} />
                <Center> <Title order={2} c={theme.colors.textColor[0]}> /{currentBoard.slug}/ : {currentBoard.name} </Title></Center>

                <Divider style={{ borderColor: theme.colors.borderCol[0] }} my="lg" variant='dashed' />

                <Routes>
                    <Route path="/" element={<ThreadList slug={currentBoard.slug}/>}></Route>
                </Routes>

            </AppShell.Main>
        </AppShell>
    )

}