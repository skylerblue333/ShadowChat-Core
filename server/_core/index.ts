import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { healthCheck } from "../health";
import { sdk } from "./sdk";
import { subscribeToMessages, type Message } from "../realtime";

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
  app.get("/health", async (_request, response) => {
    response.status(200).json(await healthCheck());
  });
  app.get("/api/messages/stream", async (request, response) => {
    const user = await sdk.authenticateRequest(request).catch(() => null);
    const participantId = Number(request.query.participantId);
    if (!user) {
      response.status(401).json({ error: "Authentication required" });
      return;
    }
    if (!Number.isInteger(participantId) || participantId < 1 || participantId === user.id) {
      response.status(400).json({ error: "A different participantId is required" });
      return;
    }
    response.writeHead(200, {
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream",
      "X-Accel-Buffering": "no",
    });
    response.write("event: ready\\ndata: {}\\n\\n");
    const sendMessage = (message: Message) => {
      if (message.senderId !== participantId && message.recipientId !== participantId) return;
      response.write(`event: message\\ndata: ${JSON.stringify(message)}\\n\\n`);
    };
    const unsubscribe = subscribeToMessages(user.id, sendMessage);
    const heartbeat = setInterval(() => response.write(": heartbeat\\n\\n"), 25_000);
    request.on("close", () => {
      clearInterval(heartbeat);
      unsubscribe();
    });
  });
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
  });
}

startServer().catch(console.error);
