import {
  Card,
  colorsTuple,
  Container,
  createTheme,
  Divider,
  getThemeColor,
  Paper,
  rem,
  Select,
  virtualColor,
} from "@mantine/core";
import type { MantineThemeOverride } from "@mantine/core";

const CONTAINER_SIZES: Record<string, string> = {
  xxs: rem("200px"),
  xs: rem("300px"),
  sm: rem("400px"),
  md: rem("500px"),
  lg: rem("600px"),
  xl: rem("1400px"),
  xxl: rem("1600px"),
};

export const  mantineTheme:MantineThemeOverride = createTheme({
  fontSizes: {
    xs: rem("12px"),
    sm: rem("14px"),
    md: rem("16px"),
    lg: rem("18px"),
    xl: rem("20px"),
    "2xl": rem("24px"),
    "3xl": rem("30px"),
    "4xl": rem("36px"),
    "5xl": rem("48px"),
  },
  spacing: {
    "3xs": rem("4px"),
    "2xs": rem("8px"),
    xs: rem("10px"),
    sm: rem("12px"),
    md: rem("16px"),
    lg: rem("20px"),
    xl: rem("24px"),
    "2xl": rem("28px"),
    "3xl": rem("32px"),
  },
  colors: {
    discordWhiteText: colorsTuple("#dadadc"),
    darkBorder: colorsTuple("#424242"),
    darkBg: colorsTuple("#2e2e2e"),
    fourchBg: colorsTuple("#e5e9fa"),
    fourchBorder: colorsTuple("#B7C5D9"),
    darkIndigo: colorsTuple("#3a59d6ff"),
    lightIndigo: colorsTuple("#748ffc"),
    linkColor: virtualColor({
      name: 'linkColor',
      light: 'darkIndigo',
      dark: 'lightIndigo'
    }),
    paperBg: virtualColor({
      name: 'paperBg',
      light: 'fourchBg',
      dark: 'darkBg'
    }),
    'borderCol': virtualColor({
      name: 'borderCol',
      light: 'fourchBorder',
      dark: 'darkBorder',
    }),
    textColor: virtualColor({
      name:  'textColor',
      light: 'black',
      dark: 'discordWhiteText'
    }),
  },
  primaryColor: "indigo",
  components: {
    Container: Container.extend({
      vars: (_, { size, fluid }) => ({
        root: {
          "--container-size": fluid
            ? "100%"
            : size !== undefined && size in CONTAINER_SIZES
            ? CONTAINER_SIZES[size]
            : rem(size),
        },
      }),
    }),
    Paper: Paper.extend({
      
      defaultProps: {
        bg: 'paperBg',
        p: "md",
        shadow: "xl",
        radius: "md",
        withBorder: true,
      },
    }),

    Card: Card.extend({
      defaultProps: {
        p: "xl",
        shadow: "xl",
        radius: "var(--mantine-radius-default)",
        withBorder: true,
      },
    }),
    Select: Select.extend({
      defaultProps: {
        checkIconPosition: "right",
      },
    }),
    Divider: Divider.extend({
      
    })
  },
  other: {
    style: "mantine",
  },
});
