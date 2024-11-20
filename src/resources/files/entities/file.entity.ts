import { InferSelectModel } from "drizzle-orm";
import { pgTable, serial, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "src/resources/users/entities/user.entity";

export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  user_id: uuid("user_id")
    .notNull()
    .references(() => users.id),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export type File = InferSelectModel<typeof files>;
