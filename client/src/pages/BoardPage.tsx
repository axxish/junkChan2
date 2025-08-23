// src/pages/BoardPage.tsx
import { Route, Routes, useParams } from "react-router"; // Use react-router-dom
import { useAppDispatch, useAppSelector } from "../store";
import { Page404 } from "./Page404";
import { useEffect } from "react";
import { fetchBoards } from "../slices/boardsSlice";
import { IconHome } from "@tabler/icons-react";
import { ThreadList } from "../components/ThreadList";

// Import our new styled components
import {
  MainContent,
  Navbar,
  NavLink,
  PageContainer,
  PageTitle
} from "./BoardPage.styled";
import { Divider, StatusText, Center, Space } from "../components/Common";

export function BoardPage() {
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
    return <StatusText>Loading...</StatusText>;
  }

  if (!currentBoard) {
    return <Page404 />;
  }

  return (
    <PageContainer>
      <Navbar>
        <NavLink to={"/"}>
          <IconHome />
        </NavLink>
      </Navbar>

      <MainContent>
        <Space />
        <Center $width="100%">
          <PageTitle>/{currentBoard.slug}/ : {currentBoard.name}</PageTitle>
         
        </Center>
           <Space />
        <Divider />

        <Routes>
          <Route path="/" element={<ThreadList slug={currentBoard.slug} />} />
          <Route path="/404" element={<>test</>} />
        </Routes>
      </MainContent>
    </PageContainer>
  );
}