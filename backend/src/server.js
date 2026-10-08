import app from "./app.js";
import { connectDB } from "../config/db.js";
import { env } from "../config/env.js";
import { startUnpaidOrderCleanup } from "../jobs/unpaidOrderCleanup.js";


console.log("EMAIL_USER loaded:", !!process.env.EMAIL_USER);
console.log("EMAIL_PASSWORD loaded:", !!process.env.EMAIL_PASSWORD, process.env.EMAIL_PASSWORD?.length);

const startServer = async () => {
  await connectDB();
  app.listen(env.port, () => {
    startUnpaidOrderCleanup();
    console.log(`Server running on port ${env.port}`);
  });
};

startServer();