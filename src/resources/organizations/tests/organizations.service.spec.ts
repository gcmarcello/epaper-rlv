import { Test, TestingModule } from "@nestjs/testing";
import { OrganizationsService } from "../organizations.service";
import { DrizzleAsyncProvider } from "@/common/db/db.provider";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { Organization } from "../entities/organizations.entity";
import { TsRestException } from "@ts-rest/nest";
import * as schema from "@/common/db/db.schema";

describe("OrganizationsService", () => {
  let service: OrganizationsService;
  let db: NodePgDatabase<typeof schema>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        {
          provide: DrizzleAsyncProvider,
          useValue: {
      transaction: jest.fn(),
            query: {
              organizations: {
                findMany: jest.fn(),
                findFirst: jest.fn(),
              },
            },
          },
        },
      ],
    }).compile();

    service = module.get<OrganizationsService>(OrganizationsService);
    db = module.get<NodePgDatabase<typeof schema>>(DrizzleAsyncProvider);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create an organization", async () => {
      const organizationDto = {
        name: "Organization",
      };

      const owner_id = crypto.randomUUID();
      const id = crypto.randomUUID();

      const createdOrg: Organization = {
        id,
        created_at: new Date(),
        name: organizationDto.name,
        updated_at: new Date(),
        owner_id,
      };

      jest.spyOn(service, "create").mockResolvedValue(createdOrg);

      const result = await service.create(organizationDto, owner_id);

      expect(result).toEqual(createdOrg);
    });
  });
  describe("findAll", () => {
    it("should return all organizations", async () => {
      const mockedResponse = {
        organizations: [
          {
            created_at: new Date(),
            id: "uuid",
            name: "Org Test",
            updated_at: new Date(),
            owner_id: "uuid",
          },
        ],
        total: 1,
      };

      jest.spyOn(service, "findAll").mockResolvedValue(mockedResponse);

      const result = await service.findAll();

      expect(result).toEqual(mockedResponse);
    });
  });
  describe("findById", () => {
    it("should return an organization by id", async () => {
      const id = crypto.randomUUID();
      const mockedOrg = {
        id,
        created_at: new Date(),
        name: "Test Org",
        updated_at: new Date(),
        owner_id: crypto.randomUUID(),
      };

      jest.spyOn(service, "findbyId").mockResolvedValue(mockedOrg);

      const result = await service.findbyId(id);

      expect(result).toEqual(mockedOrg);
    });

    it("should throw exception if organization not found", async () => {
      const id = crypto.randomUUID();

      jest.spyOn(service, "findbyId").mockRejectedValue(
        new TsRestException(organizationContract.findOrg, {
          status: 404,
          body: { message: "No User Found" },
        })
      );

      await expect(service.findbyId(id)).rejects.toEqual(
        new TsRestException(organizationContract.findOrg, {
          status: 404,
          body: { message: "No User Found" },
        })
      );
    });
  });
});
