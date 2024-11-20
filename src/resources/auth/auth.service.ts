import { Inject, Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { DrizzleAsyncProvider } from "src/common/db/db.provider";
import * as schema from "src/common/db/db.schema";
import { LoginDto } from "./dto/login.dto";
import { TsRestException } from "@ts-rest/nest";
import { organizationContract } from "../organizations/organizations.contract";
import { compare } from "src/utils/bcrypt";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class AuthService {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
    private jwtService: JwtService
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.email, loginDto.email),
    });

    const error = new TsRestException(organizationContract.findOrgs, {
      status: 404,
      body: { message: "Senha ou usuário incorretos." },
    });

    if (!user) {
      throw error;
    }

    const doesPasswordMatch = await compare(loginDto.password, user.password);

    if (!doesPasswordMatch) {
      throw error;
    }

    const token = await this.jwtService.signAsync({ id: user.id, name: user.name });

    return { token };
  }
}
