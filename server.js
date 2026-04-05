import 'dotenv/config';
import http from 'http';
import app from './src/app.js'; // Note the .js extension
import connectDB from './src/config/db.js';
import socketConnection from './src/sockets/index.js';

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Capture the IO instance
const io = socketConnection(server);

const startApp = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    process.exit(1);
  }
};

const shutdown = (signal) => {
  console.log(`\nReceived ${signal}. Closing gracefully...`);

  io.close(() => {
    console.log(" All sockets closed.");

    // 2. Stop the HTTP server
    server.close(async () => {
      console.log(" HTTP server stopped.");

      // 3. Close DB
      await mongoose.connection.close();
      console.log("MongoDB connection closed.");

      process.exit(0);
    });
  });

  // Timeout safety
  setTimeout(() => process.exit(1), 10000);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

startApp();