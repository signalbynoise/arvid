/**
 * JS-accessible mirror of --icon-* tokens defined in src/styles/theme.css.
 * Needed because Lucide's `size` prop requires a number, not a CSS variable.
 * If you change values here, update theme.css to match (and vice versa).
 */
export const ICON_SIZE = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
} as const;
