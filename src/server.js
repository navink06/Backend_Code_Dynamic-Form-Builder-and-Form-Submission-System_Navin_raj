require("dotenv").config();
const http = require("http");
const app = require("./app");
const { connectDB, disconnectDB } = require("./config/db");
const seedDatabase = require("./utils/seedData");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // 1. Establish database connection
    await connectDB();

    // 2. Run seed database
    await seedDatabase();

    // 3. Start HTTP server
    const server = http.createServer(app);

    server.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(`Form Builder API Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(` API Base: http://localhost:${PORT}/api`);
      console.log(`Health Check: http://localhost:${PORT}/health`);
      console.log(`===============================================`);
    });

    // Graceful Shutdown
    const gracefulShutdown = async (signal) => {
      console.log(`\nReceived ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await disconnectDB();
        console.log("HTTP server closed.");
        process.exit(0);
      });

      // Force close if graceful shutdown takes too long
      setTimeout(() => {
        console.error(
          "Could not close connections in time, forcefully shutting down",
        );
        process.exit(1);
      }, 10000);
    };

    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

    return server;
  } catch (error) {
    console.error(" Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
