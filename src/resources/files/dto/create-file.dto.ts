import { z } from "zod";
import { FileOrigin, FileType } from "../entities/file.entity";
import { File } from "node-fetch";

export const createFileDto = z.object({
  name: z.string().min(2).max(64),
  file_origin: z.nativeEnum(FileOrigin),
  file_type: z.nativeEnum(FileType),
  file: z.instanceof(File),
  gross_value: z.string().transform(Number).optional(),
  net_value: z.string().transform(Number).optional(),
});

export const updateFileDto = z.object({
  file: z.instanceof(File).optional(),
  name: z.string().min(2).max(64).optional(),
  file_origin: z.nativeEnum(FileOrigin).optional(),
  file_type: z.nativeEnum(FileType).optional(),
  gross_value: z.string().transform(Number).optional(),
  net_value: z.string().transform(Number).optional(),
});

export const findFileDto = z.object({
  limit: z.number().optional(),
  offset: z.number().optional(),
  search: z.string().optional(),
  file_type: z.nativeEnum(FileType).optional(),
  file_origin: z.nativeEnum(FileOrigin).optional(),
  user_id: z.string().optional(),
  organization_id: z.string().optional(),
});

export type CreateFileDto = z.infer<typeof createFileDto>;

export type UpdateFileDto = z.infer<typeof updateFileDto>;
