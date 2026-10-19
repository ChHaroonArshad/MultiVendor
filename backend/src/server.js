
import app from "./app.js";
import { connectDB } from "../config/db.js";
import { env } from "../config/env.js";
import { startUnpaidOrderCleanup } from "../jobs/unpaidOrderCleanup.js";
import { initSocket } from "../socket/socketServer.js";
import { createServer } from "node:http";

console.log("EMAIL_USER loaded:", !!process.env.EMAIL_USER);
console.log(
  "EMAIL_PASSWORD loaded:",
  !!process.env.EMAIL_PASSWORD,
  process.env.EMAIL_PASSWORD?.length
);

const startServer = async () => {
  try {
    await connectDB();

    // Create an HTTP server using your Express app
    const server = createServer(app);

    // Attach Socket.IO to the HTTP server
    initSocket(server);

    // Start listening for requests
    server.listen(env.port, () => {
      startUnpaidOrderCleanup();
      console.log(`Server running on port ${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
