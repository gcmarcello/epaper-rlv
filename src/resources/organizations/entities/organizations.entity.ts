import { InferSelectModel, relations } from "drizzle-orm";
import { pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "@/resources/users/entities/user.entity";

export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  owner_id: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const userOrganizations = pgTable(
  "user_organizations",
  {
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id),
    organization_id: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.organization_id, table.user_id] }),
    };
  }
);

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

export type Organization = InferSelectModel<typeof organizations>;
