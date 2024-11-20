import { initContract } from "@ts-rest/core";
import { z } from "zod";
import { extendZodWithOpenApi } from "@anatine/zod-openapi";
import { loginDto } from "./dto/login.dto";

extendZodWithOpenApi(z);

const c = initContract();
export const authContract = c.router({
  login: {
    method: "POST",
    description: "Login",
    path: "/auth/login",
    summary: "Login",
    responses: {
      201: c.type<{ token: string }>(),
    },
    body: loginDto,
  },
  updateActiveOrganization: {
    method: "POST",
    description: "Update active organization",
    path: "/auth/organization",
    summary: "Update active organization",
    headers: z.object({
      Authorization: z.string().optional().openapi({
        title: "Bearer Token",
      }),
    }),
    responses: {
      201: c.type<{ token: string }>(),
    },
    body: z.object({
      organizationId: z.string().uuid().openapi({
        title: "Organization ID",
      }),
    }),
  },
});
