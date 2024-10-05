/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'hero-image': "url('/img/Quote.png')",
      },
      colors: {
        'hero-bg': '#00B4D8',
        'primary-bg': '#023E8A',
        'secpmdary-bg': '#0248A3',
        'newslyzer-blue': '#CAF0F8',
        'black': '#000000',
        'white': '#FFFFFF',
      },
    },
  },
  plugins: [],
};
