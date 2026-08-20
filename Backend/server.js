const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");

const { initDb } = require("./db");
const studentRoutes = require("./routes/studentRoutes");
const staffRoutes = require("./routes/staffRoutes");
const guestRoutes = require("./routes/guestRoutes");
const adminStudentRoutes = require("./routes/adminStudentRoutes");
const adminRoutes = require("./routes/adminRoutes");
const visitRoutes = require("./routes/visitRoutes");
const { startAutoExitJob } = require("./jobs/autoExitJob");

const app = express();

// Configurable CORS options
const corsOptions = process.env.CORS_ORIGIN && process.env.CORS_ORIGIN !== "*"
  ? { origin: process.env.CORS_ORIGIN.split(",").map(o => o.trim()) }
  : {};
app.use(cors(corsOptions));
app.use(bodyParser.json());

// ── API Routes ────────────────────────────────────────────────
app.use("/api/student", studentRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/guest", guestRoutes);
app.use("/api/admin", adminStudentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/visit", visitRoutes);

// ── Serve Production Build (Vite / CRA Auto-detection) ──────
// Dynamically check potential production build output directories
const potentialBuildDirs = [
  process.env.FRONTEND_BUILD_PATH,
  path.join(__dirname, "../frontend/dist"),
  path.join(__dirname, "../frontend/build"),
  path.join(__dirname, "../dist"),
  path.join(__dirname, "../build")
].filter(Boolean);

let frontendBuildPath = null;
let frontendIndexHtml = null;

for (const buildDir of potentialBuildDirs) {
  const indexPath = path.join(buildDir, "index.html");
  if (fs.existsSync(indexPath)) {
    frontendBuildPath = buildDir;
    frontendIndexHtml = indexPath;
    break;
  }
}

if (frontendBuildPath && frontendIndexHtml) {
  app.use(express.static(frontendBuildPath, {
    maxAge: "1d",
    etag: true
  }));
  // React / Single Page App Router catch-all
  app.get("/{*path}", (req, res) => {
    res.sendFile(frontendIndexHtml);
  });
  console.log(`🌐 Serving production frontend build from ${frontendBuildPath}`);
} else {
  // Development mode fallback — supports Vite (5173) and CRA (3000)
  app.get("/", (req, res) => {
    res.json({
      status: "Backend running (dev mode)",
      note: "Frontend dev server → http://localhost:5173 or http://localhost:3000",
      api: "http://localhost:5000/api/*"
    });
  });
  console.log("⚙️  Dev mode: production frontend build not found — run `npm run build` in /frontend");
}

const PORT = parseInt(process.env.PORT || "5000", 10);

async function startServer() {
  try {
    // Fail-fast database pre-flight check
    await initDb();

    const server = app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      startAutoExitJob();
    });

    // Graceful shutdown handling
    const shutdown = (signal) => {
      console.log(`\n🛑 Received ${signal}, gracefully shutting down server...`);
      server.close(() => {
        console.log("👋 HTTP server closed.");
        process.exit(0);
      });
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (err) {
    console.error("❌ Database connection failed. Server startup aborted:", err.message || err);
    process.exit(1);
  }
}

startServer();
