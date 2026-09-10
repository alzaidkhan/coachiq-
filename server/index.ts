import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { createCoachIQApp } from "./app";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const staticPath = process.env.NODE_ENV === "production" ? path.resolve(__dirname, "public") : path.resolve(__dirname, "..", "dist", "public");
  const app = createCoachIQApp({ staticPath: process.env.NODE_ENV === "production" ? staticPath : undefined });
  const server = createServer(app);
  if (process.env.NODE_ENV === "production") {
  } else {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: { server } },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  server.listen(port, "0.0.0.0", () => console.log(`Server running on http://0.0.0.0:${port}/`));
}

startServer().catch(console.error);
