// https://astro.build/config
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://e5enclave.com',
  server: {
    host: '0.0.0.0',
    port: 3000
  },
  trailingSlash: 'never',
  build: {
    format: 'directory'
  }
});
