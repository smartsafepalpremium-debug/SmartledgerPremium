import type { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId)).limit(1);
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  (req as any).adminUser = user;
  next();
}

let bootstrapped = false;
export async function bootstrapAdmin(log?: { info: (...a: any[]) => void }): Promise<void> {
  if (bootstrapped) return;
  bootstrapped = true;
  try {
    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
    if (adminEmail) {
      const [match] = await db.select().from(usersTable).where(eq(usersTable.email, adminEmail)).limit(1);
      if (match && match.role !== "admin") {
        await db.update(usersTable).set({ role: "admin" }).where(eq(usersTable.id, match.id));
        log?.info({ email: adminEmail }, "admin.bootstrap.byEnv");
      }
    }
    const existingAdmins = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.role, "admin")).limit(1);
    if (existingAdmins.length === 0) {
      const all = await db.select().from(usersTable);
      if (all.length > 0) {
        const oldest = all.reduce((a, b) => (a.id < b.id ? a : b));
        await db.update(usersTable).set({ role: "admin" }).where(eq(usersTable.id, oldest.id));
        log?.info({ id: oldest.id, email: oldest.email }, "admin.bootstrap.firstUser");
      }
    }
  } catch (err) {
    log?.info({ err }, "admin.bootstrap.failed");
  }
}
