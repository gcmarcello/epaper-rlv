import { z } from "zod";
import { FileOrigin, FileType } from "../entities/file.entity";

export const createFileDto = z.object({
  name: z.string().min(2).max(64),
  file_origin: z.nativeEnum(FileOrigin),
  file_type: z.nativeEnum(FileType),
  file: z.any(),
  gross_value: z.string().transform(Number).optional(),
  net_value: z.string().transform(Number).optional(),
});

export type CreateFileDto = z.infer<typeof createFileDto>;
