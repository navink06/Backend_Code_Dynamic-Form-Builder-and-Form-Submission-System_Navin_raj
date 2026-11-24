const mongoose = require("mongoose");
const dns = require("dns");

let mongoMemoryServer = null;

const connectDB = async () => {
  try {
    let mongoUri = process.env.MONGODB_URI;

    if (!mongoUri || mongoUri.trim() === "") {
      console.log(
        "ℹ️ No MONGODB_URI provided. Initializing in-memory MongoDB server for seamless zero-config setup...",
      );
      const { MongoMemoryServer } = require("mongodb-memory-server");
      mongoMemoryServer = await MongoMemoryServer.create();
      mongoUri = mongoMemoryServer.getUri();
      process.env.MONGODB_URI = mongoUri;
      console.log(`✅ MongoMemoryServer started successfully at: ${mongoUri}`);
    } else if (mongoUri.startsWith("mongodb+srv://")) {
      try {
        dns.setServers(["8.8.8.8", "1.1.1.1"]);
      } catch (dnsErr) {
        // Fallback gracefully if setServers is restricted
      }
    }

    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      autoIndex: true,
    });

    console.log(
      `✅ MongoDB Atlas Connected: ${conn.connection.host} / ${conn.connection.name}`,
    );
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    if (!mongoMemoryServer) {
      console.log("⚠️ Attempting fallback to in-memory MongoDB...");
      try {
        const { MongoMemoryServer } = require("mongodb-memory-server");
        mongoMemoryServer = await MongoMemoryServer.create();
        const fallbackUri = mongoMemoryServer.getUri();
        const conn = await mongoose.connect(fallbackUri);
        console.log(`✅ Fallback MongoMemoryServer connected: ${fallbackUri}`);
        return conn;
      } catch (fallbackError) {
        console.error(
          `❌ Fallback MongoMemoryServer failed: ${fallbackError.message}`,
        );
        process.exit(1);
      }
    } else {
      process.exit(1);
    }
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongoMemoryServer) {
      await mongoMemoryServer.stop();
    }
    console.log("MongoDB disconnected successfully");
  } catch (error) {
    console.error("Error disconnecting MongoDB:", error);
  }
};

module.exports = { connectDB, disconnectDB };
