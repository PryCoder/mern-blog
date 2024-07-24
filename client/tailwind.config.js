/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    // Remove the following line if you're not customizing Flowbite styles
    'node_modules/flowbite-react/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [
    // Ensure the plugin is correctly invoked with parentheses
    require('flowbite/plugin'),require('tailwind-scrollbar')
  ],
};
