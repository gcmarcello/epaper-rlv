import { UsersService } from "./users.service";
import { tsRestHandler, TsRestHandler } from "@ts-rest/nest";
import { userContract as c } from "./users.contract";
import { Controller, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @TsRestHandler(c.createUser)
  create() {
    return tsRestHandler(c.createUser, async ({ body }) => {
      const post = await this.usersService.create(body);

      if (!post) {
        return { status: 404, body: null };
      }

      return { status: 200, body: post };
    });
  }

  @UseGuards(AuthGuard)
  @TsRestHandler(c.findUsers)
  findAll() {
    return tsRestHandler(c.findUsers, async ({ query }) => {
      const post = await this.usersService.findAll(query);

      return { status: 200, body: post };
    });
  }

  @UseGuards(AuthGuard)
  @TsRestHandler(c.findUser)
  findbyId() {
    return tsRestHandler(c.findUser, async ({ params }) => {
      const post = await this.usersService.findbyId(params.id);

      return { status: 200, body: post };
    });
  }
}
