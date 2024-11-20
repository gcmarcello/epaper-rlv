import { Inject, Injectable } from "@nestjs/common";
import { CreateOrganizationDto } from "./dto/create-organization.dto";
import { TsRestException } from "@ts-rest/nest";
import { eq } from "drizzle-orm";
import * as schema from "src/common/db/db.schema";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { QueryDto } from "src/common/db/db.dto";
import { DrizzleAsyncProvider } from "src/common/db/db.provider";
import { organizationContract } from "./organizations.contract";

@Injectable()
export class OrganizationsService {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>
  ) {}

  async create(createOrganizationDto: CreateOrganizationDto, owner_id: string) {
    return await this.db
      .insert(schema.organizations)
      .values({ ...createOrganizationDto, owner_id })
      .returning();
  }

  async findAll(queryDto?: QueryDto) {
    const organizations = await this.db.query.organizations.findMany({
      ...queryDto,
    });

    if (!organizations.length)
      throw new TsRestException(organizationContract.findOrgs, {
        status: 404,
        body: { message: "No Orgs Found" },
      });

    return { organizations, total: organizations.length };
  }

  async findbyId(id: string) {
    const organization = await this.db.query.organizations.findFirst({
      where: eq(schema.organizations.id, id),
    });

    if (!organization)
      throw new TsRestException(organizationContract.findOrg, {
        status: 404,
        body: { message: "No User Found" },
      });

    return organization;
  }
}
