import { text, pgTable, uuid, timestamp } from "drizzle-orm/pg-core";
import { InferSelectModel, relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name"),
  password: text("password"),
  email: text("email").unique(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const files = pgTable("files", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name"),
  user_id: uuid("user_id"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name"),
  owner_id: uuid("owner_id"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const userOrganizations = pgTable("user_organizations", {
  user_id: uuid("user_id").notNull(),
  organization_id: uuid("organization_id").notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  files: many(files, {
    relationName: "user_id",
  }),
  organizations: many(userOrganizations, {
    relationName: "user_id",
  }),
}));

export const organizationsRelations = relations(organizations, ({ many, one }) => ({
  users: many(userOrganizations, {
    relationName: "organization_id",
  }),
  owner: one(users, {
    fields: [organizations.owner_id],
    references: [users.id],
  }),
}));

export const userOrganizationsRelations = relations(userOrganizations, ({ one }) => ({
  user: one(users, {
    fields: [userOrganizations.user_id],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [userOrganizations.organization_id],
    references: [organizations.id],
  }),
}));

export type User = InferSelectModel<typeof users>;
export type File = InferSelectModel<typeof files>;
export type Organization = InferSelectModel<typeof organizations>;
