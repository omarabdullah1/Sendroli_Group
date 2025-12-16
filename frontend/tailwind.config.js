/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "var(--theme-primary)",
        bg: "var(--bg-primary)",
        surface: "var(--surface)",
        text: "var(--text-primary)",
      }
    },
  },
  plugins: [],
}
