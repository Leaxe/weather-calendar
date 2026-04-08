import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function icsProxyPlugin(): Plugin {
  return {
    name: 'ics-proxy',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/ics-proxy')) return next();
        const url = new URL(req.url, 'http://localhost');
        const target = url.searchParams.get('url');

        if (!target) {
          res.writeHead(400, { 'Content-Type': 'text/plain' });
          res.end('Missing ?url= parameter');
          return;
        }

        fetch(target)
          .then(async (fetchRes) => {
            if (!fetchRes.ok) {
              res.writeHead(fetchRes.status, { 'Content-Type': 'text/plain' });
              res.end(`Remote server returned ${fetchRes.status}`);
              return;
            }
            const body = await fetchRes.text();
            res.writeHead(200, {
              'Content-Type': fetchRes.headers.get('content-type') || 'text/calendar',
            });
            res.end(body);
          })
          .catch((err) => {
            res.writeHead(502, { 'Content-Type': 'text/plain' });
            res.end(`Proxy error: ${err instanceof Error ? err.message : String(err)}`);
          });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), icsProxyPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
  },
});
