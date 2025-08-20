// src/pages/BoardPage.styled.ts
import { Link } from 'react-router';
import styled from 'styled-components';

// 1. Replaces <AppShell> - The main page container using Flexbox
export const PageContainer = styled.div`
  display: flex;
  min-height: 100vh;
`;


export const Navbar = styled.nav`
  width: 45px;
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  flex-shrink: 0; 
  @media (max-width: 768px) { // Assuming 'sm' breakpoint is 768px
    display: none;
  }
`;


export const MainContent = styled.main`
  flex-grow: 1; 
  padding: 0 ${({ theme }) => theme.spacing.md};
`;


export const NavLink = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 45px;
  color: ${({ theme }) => theme.colors.text}; 
  
  &:hover {
    background-color: rgba(128, 128, 128, 0.1); 
  }
`;

// 5. Replaces <Center>
export const Centered = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
`;

// 6. Replaces <Loader> with a simple text-based loader
export const LoadingIndicator = styled(Centered)`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  color: ${({ theme }) => theme.colors.text};
  min-height: 100%; 
`;

export const PageTitle = styled.h2`
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
`;
export const StyledDivider = styled.hr`
  border: 0;
  border-top: 1px dashed ${({ theme }) => theme.colors.border};
  margin: ${({ theme }) => theme.spacing.lg} 0;
`;

export const VerticalSpace = styled.div<{ height: string }>`
  height: ${({ height }) => height};
`;