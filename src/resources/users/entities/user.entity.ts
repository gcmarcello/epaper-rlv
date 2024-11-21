import { InferSelectModel, relations } from "drizzle-orm";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { files } from "@/resources/files/entities/file.entity";
import { userOrganizations } from "@/resources/organizations/entities/organizations.entity";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  password: text("password").notNull(),
  email: text("email").unique().notNull(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  files: many(files, {
    relationName: "user_id",
  }),
  organizations: many(userOrganizations, {
    relationName: "user_id",
  }),
}));

export type User = InferSelectModel<typeof users>;
