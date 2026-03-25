import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// IMPORTANT: Replace 'room-builder' with your GitHub repo name
export default defineConfig({
  base: '/room-builder/',
  plugins: [react(), tailwindcss()],
})