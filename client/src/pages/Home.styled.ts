// src/pages/Home.styled.ts
import styled from "styled-components";
import { Link } from "react-router";

export const StyledContainer = styled.div`
  max-width: ${({ theme }) => theme.containerSizes.lg};
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.xl} ${({ theme }) =>
    theme.spacing.md};
`;

export const StyledPaper = styled.div`
  background-color: ${({ theme }) => theme.colors.paperBg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 0;
  max-height: 500px;
`;

export const StyledTitle = styled.h5`
  color: ${({ theme }) => theme.colors.text};
  text-align: center;
  margin: 0;
  padding-top: ${({theme}) => theme.spacing["2xs"]};
  padding-bottom: ${({theme}) => theme.spacing["2xs"]};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: bold;
`;

export const StyledDivider = styled.hr`
  border: 0;
  border-top: 1px dashed ${({ theme }) => theme.colors.border};
  margin: 0;
`;

export const BoardsFlexContainer = styled.div`
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  justify-content: space-evenly;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.md};
`;

export const BoardLink = styled(Link)`
  color: ${({ theme }) => theme.colors.link};
  text-decoration: none;
  font-size: ${({ theme }) => theme.fontSizes.md};
  transition: filter 0.4s cubic-bezier(.19,1,.22,1);
  will-change: transform;
  
  backface-visibility: hidden;
  &:hover {
    filter: brightness(${({ theme }) => (
      theme.colors.anchorBrightness
    )});
    transform: scale(1.06);
  }
`;

// 7. A simple component for loading/error messages
export const StatusText = styled.div`
  text-align: center;
  color: ${(props) => (props.color === "red" ? "#ff6b6b" : "inherit")};
`;
