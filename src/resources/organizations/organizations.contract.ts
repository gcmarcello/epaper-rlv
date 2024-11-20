import { initContract } from "@ts-rest/core";
import { Organization } from "src/common/db/db.schema";
import { queryDto } from "src/common/db/db.dto";
import { z } from "zod";
import { extendZodWithOpenApi } from "@anatine/zod-openapi";
import { createOrganizationDto } from "./dto/create-organization.dto";

extendZodWithOpenApi(z);

const c = initContract();
export const organizationContract = c.router(
  {
    createOrg: {
      method: "POST",
      description: "Create a organization",
      path: "/organizations",
      summary: "Create organization",
      responses: {
        201: c.type<{ message: string }>(),
      },
      body: createOrganizationDto,
    },
    findOrgs: {
      method: "GET",
      description: "Find organizations",
      path: "/organizations",
      summary: "Find organizations",
      responses: {
        200: c.type<{ organizations: Organization[]; total: number }>(),
      },
      query: queryDto,
    },
    findOrg: {
      method: "GET",
      path: "/organizations/:id",
      description: "Find a organization",
      summary: "Find a organization from ID",
      pathParams: z.object({
        id: z.string().uuid().openapi({
          title: "ID da Organizacao",
        }),
      }),
      responses: {
        200: c.type<Organization>(),
      },
    },
  },
  {
    baseHeaders: z.object({
      authorization: z.string(),
    }),
  }
);