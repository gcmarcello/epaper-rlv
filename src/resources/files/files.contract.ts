import { initContract } from "@ts-rest/core";
import { createFileDto } from "./dto/create-file.dto";
import { z } from "zod";

const c = initContract();

export const fileContract = c.router({
  createFile: {
    method: "POST",
    path: "/files",
    contentType: "multipart/form-data",
    body: createFileDto,
    headers: z.object({
      Authorization: z.string().optional(),
    }),
    responses: {
      200: c.type<{ message: string }>(),
    },
  },
  getFile: {
    method: "GET",
    path: "/files/:id",
    pathParams: z.object({
      id: z.string().transform(Number),
    }),
    responses: {
      200: c.type<{ url: string }>(),
    },
  },
});
