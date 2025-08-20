// src/components/ThreadList.styled.ts
import styled from 'styled-components';

// 1. Replaces <Loader>
export const LoadingIndicator = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.xl};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.lg};
`;

// 2. Replaces <Alert>
export const AlertBox = styled.div`
  background-color: #fff0f0; /* A light red for the background */
  border: 1px solid #ff6b6b;
  border-left: 5px solid #fa5252; /* A thicker left border for emphasis */
  color: #c92a2a; /* A dark red for the text */
  padding: ${({ theme }) => theme.spacing.md};
  margin: ${({ theme }) => theme.spacing.md} 0;
  border-radius: 4px;

  /* Basic dark mode adjustment */
  ${({ theme }) => theme.colors.background === '#2e2e2e' && `
    background-color: #4d1818;
    border-color: #a63e3e;
    border-left-color: #e03131;
    color: #ffc9c9;
  `}
`;

export const AlertTitle = styled.strong`
  display: block;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  font-weight: bold;
`;

// 3. Replaces <Stack pl="lg">
export const ThreadsContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding-left: ${({ theme }) => theme.spacing.lg};
  /* We can add a gap to space out the threads, just like Stack does */
  gap: ${({ theme }) => theme.spacing.lg}; 
`;