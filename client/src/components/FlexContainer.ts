// src/pages/Home.styled.ts
import styled, { type CSSProperties} from "styled-components";
import { type SpacingKey, isSpacingKey } from "./Common";
interface FlexContainerProps {
  $justify?: CSSProperties["justifyContent"];
  $align?: CSSProperties["alignItems"];
  $direction?: CSSProperties["flexDirection"];
  $wrap?: CSSProperties["flexWrap"];
  $gap?: SpacingKey| CSSProperties["gap"];
  $p?: SpacingKey | CSSProperties['padding'];
}

export const FlexContainer = styled.div<FlexContainerProps>`
  display: flex;
  gap: ${({ $gap: gap, theme }) => {
    if (!gap) {
      return theme.spacing.md;
    }
    if (isSpacingKey(gap, theme.spacing)) {
      return theme.spacing[gap];
    }
    return gap;
  }};
  flex-wrap: ${({ $wrap: flexWrap }) => flexWrap || "wrap"};
  justify-content: ${({ $justify: justifyContent }) =>
    justifyContent || "space-evenly"};
  align-items: ${({ $align: align }) => align || "flex-start"};
  flex-direction: ${({ $direction: flexDirection }) => flexDirection || "row"};
  padding: ${({ $p: p, theme }) => {

    if (!p) {
      return "0";
    }
    if (p in theme.spacing) {
      return theme.spacing[p as SpacingKey];
    }
    return p;
  }};
`;


export const Group = styled(FlexContainer)`
  flex-direction: row;
`;

export const Stack = styled(FlexContainer)`
  flex-direction: column;
`;

