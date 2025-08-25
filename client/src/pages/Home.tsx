// src/pages/Home.tsx
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchBoards } from '../slices/boardsSlice';

import {
  Container,
  Paper,
  Title,
  Divider,
  Anchor,
  StatusText,
} from '../components/Common';

import { FlexContainer } from '../components/FlexContainer';

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
      <Anchor key={board.id} to={`/boards/${board.slug}`}>
        {board.name}
      </Anchor>
    ));
  }
  if (status === 'failed') {
    boardsContent = <StatusText color="red">{error}</StatusText>;
  }

  return (
    <Container>
      <Paper $p={"0"}>
        <Title>Boards</Title>
        <Divider />
        <FlexContainer $p="md">{boardsContent}</FlexContainer>
      </Paper>
    </Container>
  );
}