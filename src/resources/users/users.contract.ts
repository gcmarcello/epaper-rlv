import { initContract } from "@ts-rest/core";
import { createUserDto } from "./dto/create-user.dto";
import { queryDto } from "@/common/db/db.dto";
import { z } from "zod";
import { extendZodWithOpenApi } from "@anatine/zod-openapi";
import { User } from "./entities/user.entity";

extendZodWithOpenApi(z);

const c = initContract();
export const userContract = c.router({
  createUser: {
    method: "POST",
    description: "Create a user",
    path: "/users",
    summary: "Create user",
    responses: {
      201: c.type<{ user: { name: string; id: string } }>(),
    },
    body: createUserDto,
  },
  findUsers: {
    method: "GET",
    description: "Find users",
    path: "/users",
    summary: "Find users",
    responses: {
      200: c.type<{ users: Omit<User, "password">[]; total: number }>(),
    },
    query: queryDto,
  },
  findUser: {
    method: "GET",
    path: "/users/:id",
    description: "Find a user",
    summary: "Find a user from ID",
    pathParams: z.object({
      id: z.string().uuid().openapi({
        title: "ID do Usuário",
      }),
    }),
    responses: {
      200: c.type<Omit<User, "password">>(),
    },
  },
});
