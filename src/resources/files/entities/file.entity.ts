import { organizations, users } from "@/common/db/db.schema";
import { InferSelectModel } from "drizzle-orm";
import { pgEnum, pgTable, serial, text, timestamp, uuid } from "drizzle-orm/pg-core";

export enum FileOrigin {
  DIGITIZED = "DIGITIZED",
  DIGITAL = "DIGITAL",
}

export enum FileType {
  INVOICE = "INVOICE",
  RECEIPT = "RECEIPT",
  WORK_ORDER = "WORK_ORDER",
  BILL = "BILL",
  SICK_NOTE = "SICK_NOTE",
}

export const fileOriginEnum = pgEnum("file_origin", [FileOrigin.DIGITIZED, FileOrigin.DIGITAL]);
export const fileTypeEnum = pgEnum("file_type", [
  FileType.INVOICE,
  FileType.RECEIPT,
  FileType.WORK_ORDER,
  FileType.BILL,
  FileType.SICK_NOTE,
]);

export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  user_id: uuid("user_id")
    .notNull()
    .references(() => users.id),
  organization_id: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  file_origin: fileOriginEnum(),
  file_type: fileTypeEnum(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export type File = InferSelectModel<typeof files>;
