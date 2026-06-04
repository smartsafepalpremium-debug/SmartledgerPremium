import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const ADMIN_EMAIL = "admin@smartledger.pro";
const ADMIN_PASSWORD = "SmartLedger@2025";
const ADMIN_NAME = "Super Admin";

async function seedAdmin() {
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, ADMIN_EMAIL)).limit(1);
  if (existing) {
    if (existing.role !== "admin") {
      await db.update(usersTable).set({ role: "admin" }).where(eq(usersTable.email, ADMIN_EMAIL));
      console.log(`Existing user promoted to admin: ${ADMIN_EMAIL}`);
    } else {
      console.log(`Admin already exists: ${ADMIN_EMAIL}`);
    }
  } else {
    const hashed = await bcrypt.hash(ADMIN_PASSWORD, 12);
    await db.insert(usersTable).values({
      email: ADMIN_EMAIL,
      password: hashed,
      name: ADMIN_NAME,
      experience: "expert",
      usdBalance: 0,
      role: "admin",
      status: "active",
      kycStatus: "verified",
    });
    console.log(`Admin account created:`);
    console.log(`  Email:    ${ADMIN_EMAIL}`);
    console.log(`  Password: ${ADMIN_PASSWORD}`);
  }
  process.exit(0);
}

seedAdmin().catch((e) => {
  console.error("Failed:", e.message);
  process.exit(1);
});
