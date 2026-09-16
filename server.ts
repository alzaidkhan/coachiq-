import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createCoachIQApp } from "./server/app";

async function startServer() {
  const isProd = process.env.NODE_ENV === "production";
  const distPath = path.resolve(process.cwd(), "dist", "public");
  const app = createCoachIQApp({ staticPath: isProd ? distPath : undefined });

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
      configFile: path.resolve(process.cwd(), "vite.config.ts"),
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
