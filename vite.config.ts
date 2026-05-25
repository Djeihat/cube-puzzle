import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves from /<repo-name>/ — update this if your repo name differs
  base: '/cube-puzzle/',
})
