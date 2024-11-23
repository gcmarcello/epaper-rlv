import { initContract } from "@ts-rest/core";
import { createFileDto, updateFileDto } from "./dto/create-file.dto";
import { z } from "zod";
import { extendZodWithOpenApi } from "@anatine/zod-openapi";
import { findFileDto } from "./dto/find-file.dto";
import { File } from "./entities/file.entity";

extendZodWithOpenApi(z);

const c = initContract();

export const fileContract = c.router({
  createFile: {
    method: "POST",
    path: "/files",
    description: "Create a file",
    summary: "Create file",
    contentType: "multipart/form-data",
    metadata: {
      openApiSecurity: [{ BearerAuth: [] }],
    },
    body: createFileDto,
    headers: z.object({
      Authorization: z.string().optional().openapi({
        title: "Bearer Token",
      }),
    }),
    responses: {
      200: c.type<{ message: string }>(),
    },
  },
  getFile: {
    method: "GET",
    path: "/files/:id",
    description: "Get a file",
    summary: "Get file by ID",
    metadata: {
      openApiSecurity: [{ BearerAuth: [] }],
    },
    pathParams: z.object({
      id: z.string().transform(Number).openapi({
        title: "File ID",
      }),
    }),
    responses: {
      200: c.type<{ url: string }>(),
    },
  },
  getFiles: {
    method: "GET",
    path: "/files",
    description: "Find files",
    summary: "Find files",
    metadata: {
      openApiSecurity: [{ BearerAuth: [] }],
    },
    query: findFileDto,
    responses: {
      200: c.type<{
        files: (File & { user: { name: string } | null })[];
        total: number;
      }>(),
    },
  },
  updateFile: {
    method: "PATCH",
    path: "/files/:id",
    body: updateFileDto,
    description: "Update a file",
    summary: "Update a file",
    metadata: {
      openApiSecurity: [{ BearerAuth: [] }],
    },
    pathParams: z.object({
      id: z.string().transform(Number),
    }),
    responses: {
      200: c.type<{ message: string }>(),
    },
  },
  deleteFile: {
    method: "DELETE",
    path: "/files/:id",
    description: "Delete a file",
    summary: "Delete a file",
    metadata: {
      openApiSecurity: [{ BearerAuth: [] }],
    },
    pathParams: z.object({
      id: z.string().transform(Number),
    }),
    responses: {
      200: c.type<{ message: string }>(),
    },
  },
});
