import { Inject, Injectable } from "@nestjs/common";
import { and, eq } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { DrizzleAsyncProvider } from "src/common/db/db.provider";
import * as schema from "src/common/db/db.schema";
import { LoginDto } from "./dto/login.dto";
import { TsRestException } from "@ts-rest/nest";
import { organizationContract } from "../organizations/organizations.contract";
import { compare } from "src/utils/bcrypt";
import { JwtService } from "@nestjs/jwt";
import { UserPayload } from "@/types/authenticatedRequest";

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

  async updateActiveOrganization(payload: UserPayload, organizationId: string) {
    const isUserAMemberOfOrganization = await this.db.query.userOrganizations.findFirst({
      where: and(
        eq(schema.userOrganizations.user_id, payload.id),
        eq(schema.userOrganizations.organization_id, organizationId)
      ),
    });

    if (!isUserAMemberOfOrganization) {
      throw new TsRestException(organizationContract.findOrgs, {
        status: 403,
        body: { message: "Usuário não é membro da organização." },
      });
    }

    const token = await this.jwtService.signAsync({
      id: payload.id,
      name: payload.name,
      organizationId,
    });

    return { token };
  }
}
