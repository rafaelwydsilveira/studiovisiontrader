import Fastify from "fastify";
import cors from "@fastify/cors";
import { authRoutes } from "./routes/auth";
import { analysisRoutes } from "./routes/analysis";
import { userRoutes } from "./routes/user";
import { watchlistRoutes } from "./routes/watchlist";

const server = Fastify({
  logger: true,
});

// Register plugins
server.register(cors, {
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
});

// Register routes
server.register(authRoutes, { prefix: "/api/auth" });
server.register(analysisRoutes, { prefix: "/api/analysis" });
server.register(userRoutes, { prefix: "/api/user" });
server.register(watchlistRoutes, { prefix: "/api/watchlist" });

// Health check
server.get("/api/health", async () => {
  return { status: "ok", timestamp: new Date().toISOString() };
});

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || "3001", 10);
    const host = process.env.HOST || "0.0.0.0";

    await server.listen({ port, host });
    console.log(`Server running on http://${host}:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
