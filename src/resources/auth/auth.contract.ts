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
});
