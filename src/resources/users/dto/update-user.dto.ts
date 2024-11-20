import { z } from "zod";
import { createUserDto } from "./create-user.dto";

export const updateUserDto = createUserDto.merge(z.object({ id: z.string().uuid() }));

export type UpdateUserDto = z.infer<typeof createUserDto>;
