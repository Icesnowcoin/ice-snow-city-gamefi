import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { RecoveryService } from "./recovery";
import { getMonitoringService } from "./monitoring";
import { createGlobalRateLimiter, createIpRateLimiter, createUserRateLimiter, createApiRateLimiter, closeRedisClient } from "./rateLimiter";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // The managed WebDev ingress adds one X-Forwarded-* hop. Trust only that
  // single proxy so express-rate-limit can safely resolve the client IP.
  app.set("trust proxy", 1);
  
  // Initialize rate limiters
  console.log("[Startup] Initializing rate limiters...");
  const globalLimiter = createGlobalRateLimiter();
  const ipLimiter = await createIpRateLimiter();
  const userLimiter = await createUserRateLimiter();
  const apiLimiter = await createApiRateLimiter();
  
  // Apply rate limiters
  app.use(globalLimiter); // Global rate limit
  app.use(ipLimiter); // IP-based rate limit
  app.use(userLimiter); // User-based rate limit
  app.use("/api/", apiLimiter); // API-specific rate limit
  console.log("[Startup] Rate limiters initialized successfully");
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);

  // Gameplay-only release: do not initialize legacy blockchain services or event pollers.

  // Initialize monitoring service
  console.log("[Startup] Initializing monitoring service...");
  const monitoringService = getMonitoringService();
  console.log("[Startup] Monitoring service initialized successfully");

  // Initialize recovery service
  console.log("[Startup] Initializing recovery service...");
  const recoveryService = new RecoveryService();
  console.log("[Startup] Recovery service initialized successfully");

  // Store services in app locals for access in routes
  app.locals.blockchainService = null;
  app.locals.eventListenerService = null;
  app.locals.monitoringService = monitoringService;
  app.locals.recoveryService = recoveryService;

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    console.log("[Startup] All services initialized and running");
  });

  // Graceful shutdown
  process.on("SIGTERM", async () => {
    console.log("[Shutdown] Received SIGTERM, shutting down gracefully...");
    server.close(() => {
      console.log("[Shutdown] Server closed");
      process.exit(0);
    });
  });
}

startServer().catch(console.error);
