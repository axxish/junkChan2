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
  Centered,
  LoadingIndicator,
  MainContent,
  Navbar,
  NavLink,
  PageContainer,
  PageTitle,
  StyledDivider,
  VerticalSpace
} from "./BoardPage.styled";

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
    return <LoadingIndicator>Loading...</LoadingIndicator>;
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
        <VerticalSpace height="20px" /> 
        <Centered>
          <PageTitle>/{currentBoard.slug}/ : {currentBoard.name}</PageTitle>
        </Centered>

        <StyledDivider />
        
         <Routes>
          <Route path="/" element={<ThreadList slug={currentBoard.slug} />} />
          <Route path="/404" element={<>test</>} />
        </Routes>
      </MainContent>
    </PageContainer>
  );
}