import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { EventListenerService } from "./eventListener";
import { EnhancedEventListener } from "./eventListener.enhanced";
import { RecoveryService } from "./recovery";
import { getMonitoringService } from "./monitoring";
import { BlockchainService } from "./blockchain";

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
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);

  // Initialize blockchain service
  console.log("[Startup] Initializing blockchain service...");
  const blockchainService = new BlockchainService();
  try {
    await blockchainService.initialize();
    console.log("[Startup] Blockchain service initialized successfully");
  } catch (error) {
    console.error("[Startup] Failed to initialize blockchain service:", error);
  }

  // Initialize event listener service with EnhancedEventListener
  console.log("[Startup] Initializing enhanced event listener service...");
  let eventListenerService: any;
  try {
    // First initialize base EventListenerService
    const baseListener = new EventListenerService();
    await baseListener.start();
    
    // Wrap with EnhancedEventListener for health checks and recovery
    eventListenerService = new EnhancedEventListener(baseListener);
    await eventListenerService.start();
    console.log("[Startup] Enhanced event listener service started successfully");
  } catch (error) {
    console.error("[Startup] Failed to start enhanced event listener service:", error);
    // Initialize fallback service
    try {
      eventListenerService = new EventListenerService();
      await eventListenerService.start();
      console.log("[Startup] Event listener service started successfully (error recovery)");
    } catch (fallbackError) {
      console.error("[Startup] Failed to start fallback event listener service:", fallbackError);
    }
  }

  // Initialize monitoring service
  console.log("[Startup] Initializing monitoring service...");
  const monitoringService = getMonitoringService();
  console.log("[Startup] Monitoring service initialized successfully");

  // Initialize recovery service
  console.log("[Startup] Initializing recovery service...");
  const recoveryService = new RecoveryService();
  console.log("[Startup] Recovery service initialized successfully");

  // Store services in app locals for access in routes
  app.locals.blockchainService = blockchainService;
  app.locals.eventListenerService = eventListenerService;
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
    try {
      await eventListenerService.stop();
      console.log("[Shutdown] Event listener stopped");
    } catch (error) {
      console.error("[Shutdown] Error stopping event listener:", error);
    }
    server.close(() => {
      console.log("[Shutdown] Server closed");
      process.exit(0);
    });
  });
}

startServer().catch(console.error);
