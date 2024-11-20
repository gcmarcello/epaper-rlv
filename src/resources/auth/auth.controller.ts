import { Controller, Req, UseGuards } from "@nestjs/common";
import { TsRestHandler, tsRestHandler } from "@ts-rest/nest";
import { AuthService } from "./auth.service";
import { authContract as c } from "./auth.contract";
import { AuthGuard } from "./auth.guard";
import { AuthenticatedRequest } from "@/types/authenticatedRequest";

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @TsRestHandler(c.login)
  login() {
    return tsRestHandler(c.login, async ({ body }) => {
      const post = await this.authService.login(body);

      return { status: 200, body: post };
    });
  }

  @UseGuards(AuthGuard)
  @TsRestHandler(c.updateActiveOrganization)
  updateActiveOrganization(@Req() req: AuthenticatedRequest) {
    return tsRestHandler(c.updateActiveOrganization, async ({ body }) => {
      const post = await this.authService.updateActiveOrganization(req.user, body.organizationId);

      return { status: 200, body: post };
    });
  }
}
