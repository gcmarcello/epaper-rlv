import { Controller } from "@nestjs/common";
import { OrganizationsService } from "./organizations.service";
import { TsRestHandler, tsRestHandler } from "@ts-rest/nest";
import { organizationContract as c } from "./organizations.contract";

@Controller()
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @TsRestHandler(c.createOrg)
  create() {
    return tsRestHandler(c.createOrg, async ({ body }) => {
      const post = await this.organizationsService.create(body, "s");

      if (!post) {
        return { status: 404, body: null };
      }

      return { status: 200, body: post };
    });
  }

  @TsRestHandler(c.findOrgs)
  findAll() {
    return tsRestHandler(c.findOrgs, async ({ query }) => {
      const post = await this.organizationsService.findAll(query);

      return { status: 200, body: post };
    });
  }

  @TsRestHandler(c.findOrg)
  findbyId() {
    return tsRestHandler(c.findOrg, async ({ params }) => {
      const post = await this.organizationsService.findbyId(params.id);

      return { status: 200, body: post };
    });
  }
}
