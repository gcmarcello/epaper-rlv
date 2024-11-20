import { z } from "zod";

export const queryDto = z.object({
  limit: z.coerce.number().default(10),
  offset: z.coerce.number().default(0),
});

export type QueryDto = z.infer<typeof queryDto>;
