import { Link } from "react-router";
import { styled, type CSSProperties, type DefaultTheme } from "styled-components";
import { darkTheme, lightTheme } from "../util/theme";

export type SpacingKey = keyof DefaultTheme['spacing'];


export type FontSizeKey = keyof DefaultTheme['fontSizes'];

export function isFontSizeKey(
  key: any,
  spacing: DefaultTheme["fontSizes"]
): key is FontSizeKey {
  return key in spacing;
}


export function isSpacingKey(
  key: any,
  spacing: DefaultTheme["spacing"]
): key is SpacingKey {
  return key in spacing;
}

export const Container = styled.div`
  max-width: ${({ theme }) => theme.containerSizes.lg};
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.xl} ${({ theme }) =>
    theme.spacing.md};
`;

export const Paper = styled.div<{$p?:CSSProperties["padding"]}>`
  background-color: ${({ theme }) => theme.colors.paperBg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 0;
  padding: ${({$p, theme})=>{
    if (!$p) {
      return theme.spacing.sm;
    }
    if (isSpacingKey($p, theme.spacing)) {

      return theme.spacing[$p];
    }
    return $p;
  }};
`;


export const Title = styled.h5`
  color: ${({ theme }) => theme.colors.text};
  text-align: center;
  margin: 0;
  padding-top: ${({ theme }) => theme.spacing["2xs"]};
  padding-bottom: ${({ theme }) => theme.spacing["2xs"]};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: bold;
`;

interface DividerProps {
  $width?: CSSProperties["width"];
}

export const Divider = styled.hr<DividerProps>`
  border: 0;
  border-top: 2px dashed ${({ theme }) => theme.colors.border};
  width: ${({ $width: width }) => width || "100%"};
  margin: 0;
`;


export const Anchor = styled(Link) <{ $s?: FontSizeKey | CSSProperties["fontSize"], $td?: CSSProperties["textDecoration"] }>`
  color: ${({ theme }) => theme.colors.link};
  text-decoration: none;
  font-size: ${({ $s: fs, theme }) => {

    if (!fs) {
      return theme.fontSizes.md;
    }

    if (isFontSizeKey(fs, theme.fontSizes)) {
      return theme.fontSizes[fs];
    }
    return "0";
  }};
  
  backface-visibility: hidden;
  &:hover {
    filter: brightness(${({ theme }) => (
    theme.colors.anchorBrightness
  )});
    
    text-decoration: ${({$td: td})=>{
      if(td){
        return (td);
      }
      return "underline";
    }};
  }
`;

export const StatusText = styled.div`
  text-align: center;
  color: ${(props) => (props.color === "red" ? "#ff6b6b" : "inherit")};
`;

export const ErrorBox = styled.div`
  background-color: #fff0f0; 
  border: 1px solid #ff6b6b;
  border-left: 5px solid #fa5252; 
  color: #c92a2a; 
  padding: ${({ theme }) => theme.spacing.md};
  margin: ${({ theme }) => theme.spacing.md} 0;
  border-radius: 4px;
  ${({ theme }) => theme.name === "dark" && `
    background-color: #4d1818;
    border-color: #a63e3e;
    border-left-color: #e03131;
    color: #ffc9c9;
  `}
`;


export const Text = styled.p<{ $s?: FontSizeKey | CSSProperties["fontSize"], $ta?: CSSProperties["textAlign"] }>`
  margin: 0; 
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ $s: s, theme }) => {
    if (!s) {
      return theme.fontSizes.sm;
    }
    if (isFontSizeKey(s, theme.fontSizes)) {
      return theme.fontSizes[s];
    }
    return s;
  }};

  text-align: ${({$ta:ta})=>{
    if(ta){
      return ta;
    }
    return "left";
  }};

  line-height: 1.5;
`;

export const Image = styled.img`
  height: auto; 
  display: block;
`;

export const Center = styled.div<{ $width?: CSSProperties['width'] }>`
  display: flex;

  align-items: center;
  justify-content: center;
  width: ${({ $width: width }) => width || "100%"};
`;


export const Space = styled.div<{ $height?: SpacingKey | CSSProperties["height"] }>`
  height: ${({ $height: h, theme }) => {
    if (!h) {
      return theme.spacing.sm;
    }
    if (isSpacingKey(h, theme.spacing)) {

      return theme.spacing[h];
    }
    return h;
  }};
  min-width: 1px;
`;


export const PageTitle = styled.h2`
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
`;

export const Input = styled.input`
  background-color: ${({theme})=>{
    if(theme.name==="dark"){

     return "#0000" ;
    }
  
  }};

  color: ${({theme})=>theme.colors.text};

  padding: ${({theme})=>theme.spacing["3xs"]};
  border-width: 1px;
  border-style: solid;
  border-color: ${({theme})=>theme.colors.border};
  &:focus{
    outline: ${({theme})=>{
      if(theme.name==="dark"){
        return "1px solid " + theme.colors.link;
      }
    }}
  }

`;

export const Button = styled.button`
  
`