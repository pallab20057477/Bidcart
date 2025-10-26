/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Poppins', 'Roboto', 'ui-sans-serif', 'system-ui'],
      },
      colors: {
        primary: {
          DEFAULT: '#6366F1', // Indigo-500
          light: '#A5B4FC',
          dark: '#4338CA',
          50: '#EEF2FF',
          100: '#E0E7FF',
          500: '#6366F1',
          600: '#5B21B6',
          700: '#4C1D95',
        },
        secondary: {
          DEFAULT: '#F59E42', // Orange-400
          light: '#FFD8A8',
          dark: '#C2410C',
        },
        accent: {
          DEFAULT: '#10B981', // Emerald-500
          light: '#6EE7B7',
          dark: '#047857',
        },
        base: {
          100: '#F9FAFB',
          200: '#F3F4F6',
          300: '#E5E7EB',
        },
        text: {
          DEFAULT: '#1F2937', // Gray-800
          light: '#6B7280',
        },
        gradient: {
          primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          secondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          accent: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        },
      },
      animation: {
        'fade-in': 'fade-in 0.6s ease-out',
        'slide-up': 'slide-up 0.8s ease-out',
        'glow': 'glow 2s ease-in-out infinite',
        'gradient': 'gradient-shift 3s ease infinite',
        'float': 'float 3s ease-in-out infinite',
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        protheme: {
          primary: '#6366F1',
          secondary: '#F59E42',
          accent: '#10B981',
          neutral: '#1F2937',
          'base-100': '#F9FAFB',
          info: '#3B82F6',
          success: '#22C55E',
          warning: '#F59E42',
          error: '#EF4444',
        },
      },
      'light', 'dark'
    ],
    base: true,
    styled: true,
    utils: true,
    logs: false,
    rtl: false,
    prefix: '',
    darkTheme: 'dark',
  },
}; 