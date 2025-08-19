import 'styled-components';
import type { AppTheme } from './util/styledTheme'; // Adjust the path if needed

declare module 'styled-components' {
  export interface DefaultTheme extends AppTheme {}
}