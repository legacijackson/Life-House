import { db } from "./db.js";
import { users } from "@shared/schema.js";
import bcrypt from "bcryptjs";

const seedUsers = async () => {
  console.log("🌱 Seeding users...");
  
  try {
    // Hash password for all test users
    const passwordHash = await bcrypt.hash("password123", 10);
    
    // Test users for different roles
    const testUsers = [
      {
        name: "Sarah Williams",
        email: "sarah.williams@lifehouse.org",
        passwordHash,
        role: "CaseManager" as const,
      },
      {
        name: "Julius Administrator",
        email: "julius@lifehouse.org",
        passwordHash,
        role: "Admin" as const,
      },
      {
        name: "Brittney Admin",
        email: "brittney@lifehouse.org",
        passwordHash,
        role: "Admin" as const,
      },
      {
        name: "Kairia Admin",
        email: "kairia@lifehouse.org",
        passwordHash,
        role: "Admin" as const,
      },
      {
        name: "Marcus Johnson",
        email: "marcus.johnson@email.com",
        passwordHash,
        role: "Resident" as const,
      },
      {
        name: "Test Intake",
        email: "intake@lifehouse.org",
        passwordHash,
        role: "Intake" as const,
      },
      {
        name: "Test Referrer",
        email: "referrer@lifehouse.org",
        passwordHash,
        role: "Referrer" as const,
      },
      {
        name: "Test Auditor",
        email: "auditor@lifehouse.org",
        passwordHash,
        role: "Auditor" as const,
      }
    ];
    
    // Insert users
    for (const userData of testUsers) {
      try {
        await db.insert(users).values(userData);
        console.log(`✅ Created user: ${userData.email} (Role: ${userData.role})`);
      } catch (error: any) {
        if (error.code === '23505') { // PostgreSQL unique constraint error
          console.log(`⚠️  User already exists: ${userData.email}`);
        } else {
          console.error(`❌ Error creating user ${userData.email}:`, error.message);
        }
      }
    }
    
    console.log("\n✨ User seeding complete!");
    console.log("\n📝 Test credentials:");
    console.log("   All passwords: password123");
    console.log("\n🔑 Available test accounts:");
    console.log("   - sarah.williams@lifehouse.org (Case Manager)");
    console.log("   - julius@lifehouse.org (Admin)");
    console.log("   - marcus.johnson@email.com (Resident)");
    console.log("   - intake@lifehouse.org (Intake Staff)");
    
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

// Run the seed function
seedUsers().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error("Seed script failed:", error);
  process.exit(1);
});