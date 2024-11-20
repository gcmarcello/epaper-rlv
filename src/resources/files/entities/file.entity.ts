import { organizations, users } from "@/common/db/db.schema";
import { InferSelectModel } from "drizzle-orm";
import { pgTable, serial, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  user_id: uuid("user_id")
    .notNull()
    .references(() => users.id),
  organization_id: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export type File = InferSelectModel<typeof files>;
