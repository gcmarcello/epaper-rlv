import { Inject, Injectable } from "@nestjs/common";
import { CreateOrganizationDto } from "./dto/create-organization.dto";
import { TsRestException } from "@ts-rest/nest";
import { eq } from "drizzle-orm";
import * as schema from "@/common/db/db.schema";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { QueryDto } from "@/common/db/db.dto";
import { DrizzleAsyncProvider } from "@/common/db/db.provider";
import { organizationContract } from "./organizations.contract";

@Injectable()
export class OrganizationsService {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>
  ) {}

  async create(createOrganizationDto: CreateOrganizationDto, owner_id: string) {
    const org = await this.db.transaction(async (trx) => {
      const newOrg = await trx
        .insert(schema.organizations)
        .values({ ...createOrganizationDto, owner_id })
        .returning();

      await trx.insert(schema.userOrganizations).values({
        user_id: owner_id,
        organization_id: newOrg[0].id,
      });
      return newOrg[0];
    });

    return org;
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
        body: { message: "No Org Found" },
      });

    return organization;
  }
}
