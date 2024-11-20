import { Controller } from "@nestjs/common";
import { TsRestHandler, tsRestHandler } from "@ts-rest/nest";
import { AuthService } from "./auth.service";
import { authContract as c } from "./auth.contract";

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
}
