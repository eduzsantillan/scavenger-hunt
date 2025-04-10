import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://scavenger-hunt-env.eba-2dvq4pug.us-east-1.elasticbeanstalk.com',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
