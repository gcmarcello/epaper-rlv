import { text, pgTable, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name"),
  password: text("password"),
  email: text("email").unique(),
});

export const files = pgTable("files", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name"),
  user_id: uuid("user_id"),
});

export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name"),
  owner_id: uuid("owner_id"),
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
