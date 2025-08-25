// src/pages/BoardPage.styled.ts
import styled from 'styled-components';

export const PageContainer = styled.div`
  display: flex;
  min-height: 100vh;
`;


export const Navbar = styled.nav`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-basis: 200px;
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  flex-shrink: 0; 
  @media (max-width: 768px) { 
    display: none;
  }
`;


export const MainContent = styled.main`
  flex-grow: 1; 
  padding: 0 ${({ theme }) => theme.spacing.md};
`;



