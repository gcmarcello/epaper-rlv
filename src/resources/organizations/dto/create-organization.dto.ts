import { z } from "zod";

export const createOrganizationDto = z.object({
  name: z.string().min(3).max(50),
});

export type CreateOrganizationDto = z.infer<typeof createOrganizationDto>;
