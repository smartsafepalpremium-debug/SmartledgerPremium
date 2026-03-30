import { pgTable, text, serial, real, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const holdingsTable = pgTable("holdings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  coin: text("coin").notNull(),
  symbol: text("symbol").notNull(),
  amount: real("amount").notNull().default(0),
  avgBuyPrice: real("avg_buy_price").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertHoldingSchema = createInsertSchema(holdingsTable).omit({ id: true, updatedAt: true });
export type InsertHolding = z.infer<typeof insertHoldingSchema>;
export type Holding = typeof holdingsTable.$inferSelect;
