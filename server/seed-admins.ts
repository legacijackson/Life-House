import { db } from "./db.js";
import { users } from "@shared/schema.js";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

const admins = [
  { email: "julius@lifehousereentry.com", name: "Julius", firstName: "Julius", lastName: "" },
  { email: "kai@lifehousereentry.com", name: "Kai", firstName: "Kai", lastName: "" },
  { email: "brittney@lifehousereentry.com", name: "Brittney", firstName: "Brittney", lastName: "" },
];

async function seedAdmins() {
  const defaultPassword = process.env.ADMIN_SEED_PASSWORD || "LifeHouse2025!";
  const hash = await bcrypt.hash(defaultPassword, 10);

  for (const admin of admins) {
    const existing = await db.select().from(users).where(eq(users.email, admin.email)).limit(1);
    if (existing.length > 0) {
      // Update existing user to have isAdmin = true
      await db.update(users)
        .set({ isAdmin: true, passwordHash: hash, updatedAt: new Date() })
        .where(eq(users.email, admin.email));
      console.log(`✓ Updated admin: ${admin.email}`);
    } else {
      await db.insert(users).values({
        email: admin.email,
        name: admin.name,
        firstName: admin.firstName,
        lastName: admin.lastName,
        role: "CaseManager",
        isAdmin: true,
        passwordHash: hash,
      });
      console.log(`✓ Created admin: ${admin.email}`);
    }
  }
  console.log(`\nAdmin password: ${defaultPassword}`);
  console.log("Change passwords after first login!");
}

seedAdmins()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1); });
