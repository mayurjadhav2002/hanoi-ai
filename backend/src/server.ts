import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

import documentRoutes from "./routes/documents.js";
import folderRoutes from "./routes/folders.js";
import invitationRoutes from "./routes/invitations.js";
import fileRoutes from "./routes/files.js";
import liveblocksRoutes from "./routes/liveblocks.js";
import aiRoutes from "./routes/ai.js";

const app = express();
const port = process.env.BACKEND_PORT || 8000;

app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || "http://localhost:3000",
      "http://localhost:3000",
      "http://localhost:3001",
    ],
    credentials: true,
  })
);

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Routes
app.use("/api/documents", documentRoutes);
app.use("/api/folders", folderRoutes);
app.use("/api/invitations", invitationRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/liveblocks-auth", liveblocksRoutes);
app.use("/api/ai", aiRoutes);

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[Server Error]", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

if (process.env.NODE_ENV !== "test") {
  app.listen(port, () => {
    console.log(`🚀 Hanoi AI Backend Server running on http://localhost:${port}`);
  });
}

export default app;
