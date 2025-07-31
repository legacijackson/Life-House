// PRODUCTION READY - NO MOCK DATA
// This file is kept for reference but should not be used in production
// All test users and mock data have been removed for live deployment

import { db } from "./db.js";
import { users } from "@shared/schema.js";
import bcrypt from "bcryptjs";

const seedUsers = async () => {
  console.log("⚠️  This is a production system - no mock data will be seeded.");
  console.log("💡 Create real user accounts through the application interface or admin panel.");
  return;
};

// Run the seed function  
seedUsers().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error("Seed script failed:", error);
  process.exit(1);
});