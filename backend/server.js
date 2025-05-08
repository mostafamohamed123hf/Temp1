const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const path = require("path");
require("dotenv").config();
const http = require("http");
const WebSocket = require("ws");
const errorHandler = require("./middleware/error");
const { apiLimiter } = require("./middleware/rateLimiter");
const csrfProtection = require("./middleware/csrf");

// Import routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const visitorRoutes = require("./routes/visitors");
const productRoutes = require("./routes/products");
const orderRoutes = require("./routes/orders");
const voucherRoutes = require("./routes/vouchers");

// Initialize express app
const app = express();
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Store connected clients
const clients = new Set();

// WebSocket connection handler
wss.on("connection", (ws, req) => {
  const clientIp = req.socket.remoteAddress || "unknown";
  console.log(`Client connected from ${clientIp}`);
  clients.add(ws);

  // Send initial message
  try {
    ws.send(
      JSON.stringify({
        type: "connection",
        message: "Connected to Digital Menu WebSocket Server",
      })
    );
  } catch (error) {
    console.error("Error sending initial message:", error);
  }

  // Set up ping interval to detect disconnected clients
  const pingInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
    } else {
      clearInterval(pingInterval);
    }
  }, 30000);

  ws.on("message", (message) => {
    try {
      console.log("Received message:", message);
      const parsedMessage = JSON.parse(message);

      // Handle incoming messages
      if (parsedMessage.type === "ping") {
        ws.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
      }
    } catch (error) {
      console.error("Error processing message:", error);
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Invalid message format",
        })
      );
    }
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
    clients.delete(ws);
    clearInterval(pingInterval);
  });

  ws.on("close", (code, reason) => {
    console.log(
      `Client disconnected with code ${code}, reason: ${reason || "unknown"}`
    );
    clients.delete(ws);
    clearInterval(pingInterval);
  });
});

// Make WebSocket server available globally with improved error handling
global.notifyClients = (type, data) => {
  const message = JSON.stringify({
    type,
    data,
    timestamp: new Date().toISOString(),
  });

  let activeClients = 0;

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(message);
        activeClients++;
      } catch (error) {
        console.error("Error sending notification to client:", error);
        // Remove problematic client
        clients.delete(client);
      }
    } else if (
      client.readyState === WebSocket.CLOSED ||
      client.readyState === WebSocket.CLOSING
    ) {
      // Clean up closed connections
      clients.delete(client);
    }
  });

  console.log(`Notified ${activeClients} clients about ${type}`);
};

// Security middleware
app.use(helmet());

// Configure CORS with specific options
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",")
      : ["http://127.0.0.1:5500", "http://localhost:5500"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Rate limiting - now using our custom middleware
app.use("/api/", apiLimiter);

// Logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Parse JSON request body
app.use(express.json());

// Apply CSRF protection to all API routes
app.use("/api", csrfProtection);

// Define routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/visitors", visitorRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/vouchers", voucherRoutes);

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../")));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../", "index.html"));
  });
}

// Error handling middleware (after all route definitions)
app.use(errorHandler);

// Connect to MongoDB
const connectDB = async () => {
  try {
    // Using a default connection string if environment variable is not set
    const mongoURI =
      process.env.MONGODB_URI || "mongodb://localhost:27017/digitalmenu";

    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("MongoDB Connected...");

    // Create default admin user if none exists
    const User = require("./models/User");
    const adminExists = await User.findOne({ role: "admin" });

    if (!adminExists) {
      console.log("Creating default admin user...");
      // Use environment variable for default admin password or a more secure default
      const defaultAdminPassword =
        process.env.DEFAULT_ADMIN_PASSWORD ||
        Math.random().toString(36).slice(-10);
      await User.create({
        displayName: "Admin User",
        username: "admin",
        email: "admin@example.com",
        password: defaultAdminPassword,
        role: "admin",
        status: "active",
        permissions: {
          stats: true,
          productsView: true,
          productsEdit: true,
          vouchersView: true,
          vouchersEdit: true,
          tax: true,
          qr: true,
          users: true,
        },
      });
      console.log(
        "Default admin user created with password:",
        defaultAdminPassword
      );
      console.log(
        "IMPORTANT: Please change this password immediately after first login!"
      );
    }

    // Create default products if none exist
    const Product = require("./models/Product");
    const productsExist = await Product.countDocuments();

    if (!productsExist) {
      console.log("Creating default products...");
      const defaultProducts = [
        {
          id: "pizza1",
          name: "بيتزا بيروني غنائي",
          description:
            "بيتزا بيروني مع الجبن الموزاريلا وصلصة الطماطم، بيتزا ايطالية اصلية",
          price: 140.0,
          category: "pizza",
          image:
            "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=800&q=80",
          rating: 4.8,
        },
        {
          id: "pizza2",
          name: "بيتزا بيروني غنائي",
          description:
            "بيتزا بيروني مع الجبن الموزاريلا وصلصة الطماطم، بيتزا ايطالية اصلية",
          price: 140.0,
          category: "pizza",
          image:
            "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
          rating: 4.8,
        },
        {
          id: "burger1",
          name: "برجر لحم أنغوس",
          description: "برجر لحم بقري أنغوس مع جبنة شيدر وصلصة خاصة",
          price: 120.0,
          category: "burger",
          image:
            "https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=800&q=80",
          rating: 4.9,
        },
        {
          id: "burger2",
          name: "برجر دجاج مقرمش",
          description: "برجر دجاج مقرمش محمر مع صلصة الثوم والخس",
          price: 95.0,
          category: "burger",
          image:
            "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
          rating: 4.6,
        },
        {
          id: "sandwich1",
          name: "سندويتش شاورما",
          description: "شاورما دجاج مع صلصة طحينة وخضار منوعة",
          price: 65.0,
          category: "sandwich",
          image:
            "https://images.unsplash.com/photo-1485451456034-3f9391c6f769?auto=format&fit=crop&w=800&q=80",
          rating: 4.7,
        },
        {
          id: "drink1",
          name: "عصير فواكه طازج",
          description: "مزيج من الفواكه الطازجة المنعشة",
          price: 35.0,
          category: "drink",
          image:
            "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80",
          rating: 4.5,
        },
      ];
      await Product.insertMany(defaultProducts);
      console.log("Default products created");
    }
  } catch (err) {
    console.error("Failed to connect to MongoDB", err);
    // Exit process with failure
    process.exit(1);
  }
};

// Connect to database
connectDB();

// Set port
const PORT = process.env.PORT || 5050;

// Start server
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
