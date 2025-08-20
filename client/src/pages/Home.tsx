// src/pages/Home.tsx
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchBoards } from '../slices/boardsSlice';

import {
  StyledContainer,
  StyledPaper,
  StyledTitle,
  StyledDivider,
  BoardsFlexContainer,
  BoardLink,
  StatusText,
} from './Home.styled';

export function Home() {
  const dispatch = useAppDispatch();
  const { boards, status, error } = useAppSelector((state) => state.boards);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchBoards());
    }
  }, [status, dispatch]);

  let boardsContent;
  if (status === 'loading') {
    boardsContent = <StatusText>Loading...</StatusText>;
  }
  if (status === 'succeeded') {
    boardsContent = boards.map((board) => (
      <BoardLink key={board.id} to={`/boards/${board.slug}`}>
        {board.name}
      </BoardLink>
    ));
  }
  if (status === 'failed') {
    boardsContent = <StatusText color="red">{error}</StatusText>;
  }

  return (
    <StyledContainer>
      <StyledPaper>
        <StyledTitle>Boards</StyledTitle>
        <StyledDivider />
        <BoardsFlexContainer>{boardsContent}</BoardsFlexContainer>
      </StyledPaper>
    </StyledContainer>
  );
}