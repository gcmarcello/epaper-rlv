import { z } from "zod";

export const createUserDto = z.object({
  name: z.string().min(3).max(50),
  password: z.string().min(6).max(50),
  email: z.string().email(),
});

export type CreateUserDto = z.infer<typeof createUserDto>;
