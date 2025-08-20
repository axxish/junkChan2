import { createGlobalStyle } from "styled-components";

const rem = (px: number) => `${px / 16}rem`;

const fontSizes = {
  xs: rem(12),
  sm: rem(14),
  md: rem(15),
  lg: rem(18),
  xl: rem(20),
  "2xl": rem(24),
};

const spacing = {
  "3xs": rem(4),
  "2xs": rem(8),
  xs: rem(10),
  sm: rem(12),
  md: rem(16),
  lg: rem(20),
  xl: rem(24),
};

const containerSizes: Record<string, string> = {
  xxs: rem(200),
  xs: rem(300),
  sm: rem(400),
  md: rem(500),
  lg: rem(600),
  xl: rem(1400),
  xxl: rem(1600),
};

export const lightTheme = {
  name: "light",

  fontSizes,
  spacing,
  containerSizes,
  colors: {

    background: "#e5e9fa",
    text: "#000000",
    border: "#B7C5D9",
    link: "#3a59d6",
    paperBg: "#e5e9fa",
    anchorBrightness: 0.7,
  },
};

export const darkTheme = {
  name: "dark",
  fontSizes,
  spacing,
  containerSizes,
  colors: {
    background: "#171717",
    text: "#dadadc",
    border: "#424242",
    link: "#748ffc",
    paperBg: "#1f1f1f",
    anchorBrightness: 1.3,
  },
};

export type AppTheme = typeof lightTheme;

// --- Global Style Component ---
export const GlobalStyle = createGlobalStyle`
  body {
    background-color: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.text};
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
  
  }
`;
