/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Brand colors — change these to rebrand the entire app
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
        // Surface colors — backgrounds and cards
        surface: {
          DEFAULT: '#ffffff',
          secondary: '#f8f9fa',
          tertiary: '#f1f3f5',
          inverse: '#1a1b1e',
          'inverse-secondary': '#2c2e33',
        },
        // Text colors
        content: {
          DEFAULT: '#1a1b1e',
          secondary: '#495057',
          tertiary: '#868e96',
          inverse: '#ffffff',
          'inverse-secondary': '#c1c2c5',
        },
        // Semantic colors
        success: {
          50: '#ebfbee',
          500: '#40c057',
          700: '#2f9e44',
        },
        warning: {
          50: '#fff9db',
          500: '#fab005',
          700: '#e67700',
        },
        danger: {
          50: '#fff5f5',
          500: '#fa5252',
          700: '#e03131',
        },
        info: {
          50: '#e7f5ff',
          500: '#339af0',
          700: '#1c7ed6',
        },
        // Border colors
        border: {
          DEFAULT: '#dee2e6',
          secondary: '#e9ecef',
          focus: '#4c6ef5',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
        button: '8px',
        input: '8px',
        full: '9999px',
      },
    },
  },
  plugins: [],
};
