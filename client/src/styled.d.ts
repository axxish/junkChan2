import 'styled-components';
import type { AppTheme } from './util/theme'; // Adjust the path if needed

declare module 'styled-components' {
  export interface DefaultTheme extends AppTheme {}
}