require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");
const redis = require("redis");
const prisma = require("./prisma.js");

// 1. IMPORT ALL ROUTES AT THE TOP
const paymentRoutes = require('./routes/payment');
const authRoutes = require("./routes/auth.routes.js");
const userRoutes = require("./routes/users.js");
const followRoutes = require("./routes/follow");
const eventRoutes = require("./routes/events");
const uploadRoutes = require("./routes/upload");
const postRoutes = require("./routes/posts");
const communityRoutes = require("./routes/communities");
const articleRoutes = require("./routes/articles");
const commentRoutes = require("./routes/comments");
const messengerRoutes = require('./routes/messenger'); // Imported here
const notificationRoutes = require('./routes/notifications');

const app = express();
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// ================= STRIPE WEBHOOK (MUST BE BEFORE express.json) =================
app.use('/api', paymentRoutes);

// ================= GLOBAL MIDDLEWARE =================
app.use(express.json());

const allowedOrigins = [
  "https://studious-robot-r4wpqgpjp572wj5-5173.app.github.dev",
  "http://localhost:5173",
  "http://localhost:3000",
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || origin.endsWith("app.github.dev")) {
        return callback(null, true);
      }
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ================= STATIC FILES =================
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// ================= REDIS SETUP =================
let redisClient = null;
(async () => {
  if (process.env.ENABLE_REDIS_CACHE === "true") {
    try {
      redisClient = redis.createClient({ url: process.env.REDIS_URL });
      redisClient.on("error", (err) => console.error("❌ Redis Error:", err));
      await redisClient.connect();
      console.log("✅ Redis connected");
      app.set("redisClient", redisClient);
    } catch (err) {
      console.error("❌ Redis failed to connect:", err);
    }
  }
})();

// ================= SOCKET.IO =================
let io = null;
if (process.env.ENABLE_SOCKET_IO === "true") {
  io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });
  app.set("io", io);
  io.on("connection", (socket) => {
    console.log("🔌 Socket connected:", socket.id);
    socket.on("join", (userId) => socket.join(userId));
  });
}

// ================= REQUEST LOGGING =================
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// ================= ROUTES =================
app.use("/api/users", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/follow", followRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/communities", communityRoutes);
app.use("/api/articles", articleRoutes);
app.use("/api", commentRoutes); 
app.use('/api/messenger', messengerRoutes); // Variable is now defined
app.use('/api/notifications', notificationRoutes);

// ================= HEALTH & START =================
app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "connected" });
  } catch (e) {
    res.status(500).json({ status: "error", db: "disconnected", details: e.message });
  }
});

app.get("/", (req, res) => res.send("Server is running!"));

// ================= GLOBAL ERROR HANDLER =================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong on the server!" });
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 Frontend expected at: ${process.env.FRONTEND_URL}`);
});