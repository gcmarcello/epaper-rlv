import { Controller, Req, UseGuards } from "@nestjs/common";
import { OrganizationsService } from "./organizations.service";
import { TsRestHandler, tsRestHandler } from "@ts-rest/nest";
import { organizationContract as c } from "./organizations.contract";
import { AuthGuard } from "../auth/auth.guard";
import { AuthenticatedRequest } from "@/types/authenticatedRequest";

@Controller()
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @UseGuards(AuthGuard)
  @TsRestHandler(c.createOrg)
  create(@Req() req: AuthenticatedRequest) {
    return tsRestHandler(c.createOrg, async (data) => {
      const org = await this.organizationsService.create(data.body, req.user.id);

      return { status: 200, body: org };
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
