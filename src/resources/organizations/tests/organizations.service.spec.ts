import { Test, TestingModule } from "@nestjs/testing";
import { OrganizationsService } from "../organizations.service";
import { DrizzleAsyncProvider } from "@/common/db/db.provider";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { CreateOrganizationDto } from "../dto/create-organization.dto";
import { QueryDto } from "@/common/db/db.dto";
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
    it("should create a new organization", async () => {
      const createOrganizationDto: CreateOrganizationDto = { name: "Test Org" };
      const owner_id = crypto.randomUUID();
      const newOrg = { id: crypto.randomUUID(), ...createOrganizationDto, owner_id };

      db.transaction = jest.fn().mockImplementation(async (callback) => {
        return callback({
          insert: jest.fn().mockReturnValue({
            values: jest.fn().mockReturnValue({
              returning: jest.fn().mockResolvedValue([newOrg]),
            }),
          }),
        });
      });

      const result = await service.create(createOrganizationDto, owner_id);
      expect(result).toEqual(newOrg);
    });
  });

  describe("findAll", () => {
    it("should return all organizations", async () => {
      const queryDto: QueryDto = {
        limit: 10,
        offset: 0,
      };
      const organizations = [{ id: "org-id", name: "Test Org" }];

      db.query.organizations.findMany = jest.fn().mockResolvedValue(organizations);

      const result = await service.findAll(queryDto);
      expect(result).toEqual({ organizations, total: organizations.length });
    });

    it("should throw an exception if no organizations found", async () => {
      db.query.organizations.findMany = jest.fn().mockResolvedValue([]);

      await expect(service.findAll()).rejects.toThrow(TsRestException);
    });
  });

  describe("findbyId", () => {
    it("should return an organization by id", async () => {
      const id = "org-id";
      const organization = { id, name: "Test Org" };

      db.query.organizations.findFirst = jest.fn().mockResolvedValue(organization);

      const result = await service.findbyId(id);
      expect(result).toEqual(organization);
    });

    it("should throw an exception if organization not found", async () => {
      const id = "org-id";

      db.query.organizations.findFirst = jest.fn().mockResolvedValue(null);

      await expect(service.findbyId(id)).rejects.toThrow(TsRestException);
    });
  });
});
