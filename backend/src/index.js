import connectDB from "./db/db.js";
import dotenv from "dotenv";
import { app } from "./app.js";
import express from "express";

dotenv.config({ path: "./src/.env" });
const port = process.env.PORT || 4002;

// Connect to MongoDB
connectDB()
  .then(() => {
    console.log("MongoDB Connected");
  })
  .catch((error) => {
    console.error(error);
    connectDB();
  });

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 