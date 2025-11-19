import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Enable JSX in .js files
      include: "**/*.{jsx,tsx,js,ts}"
    })
  ],
  server: {
    port: 3000,
    host: 'localhost',
    // Disable HMR in production
    hmr: process.env.NODE_ENV === 'development',
    // Security headers for development server
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    }
  },
  build: {
    // Security optimizations
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true
      }
    },
    // Generate source maps for debugging (can be disabled in production)
    sourcemap: process.env.NODE_ENV === 'development',
    // Enable chunking for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          axios: ['axios']
        }
      }
    }
  },
  // Environment variable prefix for security
  envPrefix: 'VITE_',
  // Disable .env file loading in production for security
  envDir: process.env.NODE_ENV === 'development' ? '.' : false
})
