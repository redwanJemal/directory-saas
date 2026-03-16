/**
 * Centralized color constants for use in icon props and other
 * non-className contexts. These match the values in tailwind.config.js
 * — change them here to rebrand the app.
 */
export const colors = {
  brand: {
    50: '#f0f4ff',
    100: '#dbe4ff',
    200: '#bac8ff',
    300: '#91a7ff',
    400: '#748ffc',
    500: '#5c7cfa',
    600: '#4c6ef5',
    700: '#4263eb',
    800: '#3b5bdb',
    900: '#364fc7',
    950: '#2b3f9e',
  },
  content: {
    DEFAULT: '#1a1b1e',
    secondary: '#495057',
    tertiary: '#868e96',
    inverse: '#ffffff',
  },
  surface: {
    DEFAULT: '#ffffff',
    secondary: '#f8f9fa',
    tertiary: '#f1f3f5',
    inverse: '#1a1b1e',
  },
  success: { 500: '#40c057', 700: '#2f9e44' },
  warning: { 500: '#fab005', 700: '#e67700' },
  danger: { 500: '#fa5252', 700: '#e03131' },
  info: { 500: '#339af0', 700: '#1c7ed6' },
  border: { DEFAULT: '#dee2e6' },
} as const;
