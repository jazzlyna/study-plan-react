import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,  // ← ADD THIS LINE (different from original)
    open: true    // ← Optional: opens browser automatically
  }
})