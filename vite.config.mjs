import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { installGlobals } from "@remix-run/node"

installGlobals();

export default defineConfig({
  server: {
    port: 3000,
    hmr: {
      port: 3000, // 👈 WebSocket na mesma porta
    },
  },
  plugins: [remix({
    ignoredRouteFiles: ["**/*.css"],
    future: {
      v3_fetcherPersist: true,
      v3_relativeSplatPath: true,
      v3_throwAbortReason: true
    },
  }),
  tsconfigPaths(),
  // middleware para evitar erro na console de vs code para esse caminho
  {
    name: 'well-known-fallback',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith("/.well-known/")) {
          res.statusCode = 204;
          res.end();
          return;
        }
        next();
      });
    }
  }
  ],
});
