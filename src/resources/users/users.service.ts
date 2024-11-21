import { Inject, Injectable } from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto";
import { DrizzleAsyncProvider } from "@/common/db/db.provider";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "../../common/db/db.schema";
import { hash } from "@/utils/bcrypt";
import { eq } from "drizzle-orm";
import { QueryDto } from "@/common/db/db.dto";
import { TsRestException } from "@ts-rest/nest";
import { userContract } from "./users.contract";

@Injectable()
export class UsersService {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>
  ) {}

  async create(createUserDto: CreateUserDto) {
    const existingEmail = await this.db.query.users.findFirst({
      where: eq(schema.users.email, createUserDto.email),
    });
    if (existingEmail) {
      throw new TsRestException(userContract.createUser, {
        status: 409,
        body: { message: "Email already exists" },
      });
    }
    await this.db
      .insert(schema.users)
      .values({ ...createUserDto, password: await hash(createUserDto.password) });
    return { message: "User created" };
  }

  async findAll(queryDto?: QueryDto) {
    const users = await this.db.query.users.findMany({
      ...queryDto,
      columns: { email: true, id: true, name: true, created_at: true, updated_at: true },
    });

    if (!users.length)
      throw new TsRestException(userContract.findUsers, {
        status: 404,
        body: { message: "No Users Found" },
      });

    return { users, total: users.length };
  }

  async findbyId(id: string) {
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, id),
      columns: { email: true, id: true, name: true, created_at: true, updated_at: true },
    });

    if (!user)
      throw new TsRestException(userContract.findUser, {
        status: 404,
        body: { message: "No User Found" },
      });

    return user;
  }
}
