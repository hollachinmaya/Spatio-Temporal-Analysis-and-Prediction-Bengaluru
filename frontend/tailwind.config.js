/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg:       '#050a14',
        surface:  '#0c1526',
        surface2: '#111d35',
        accent:   '#00c8ff',
        accent2:  '#ff6b2b',
        accent3:  '#39ff8e',
        accent4:  '#b06dff',
        text2:    '#7fa8cc',
        text3:    '#4a6a8a',
      },
      fontFamily: {
        mono: ['"Space Mono"', 'monospace'],
        sans: ['"DM Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
