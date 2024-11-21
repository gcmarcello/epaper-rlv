import { z } from "zod";
import { FileOrigin, FileType } from "../entities/file.entity";
import { queryDto } from "@/common/db/db.dto";

export const findFileDto = queryDto.merge(
  z.object({
    name: z.string().optional(),
    date_start: z.coerce.date().optional(),
    date_end: z.coerce.date().optional(),
    file_type: z.nativeEnum(FileType).optional(),
    file_origin: z.nativeEnum(FileOrigin).optional(),
    user_name: z.string().optional(),
    gross_value: z.coerce.number().optional(),
    net_value: z.coerce.number().optional(),
  })
);

export type FindFileDto = z.infer<typeof findFileDto>;
