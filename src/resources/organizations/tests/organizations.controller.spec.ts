import { Test, TestingModule } from "@nestjs/testing";
import { OrganizationsController } from "../organizations.controller";
import { OrganizationsService } from "../organizations.service";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { CreateOrganizationDto } from "../dto/create-organization.dto";
import { AuthenticatedRequest } from "@/types/authenticatedRequest";
import { Organization } from "../entities/organizations.entity";

export const ConfigServiceMock = {
  provide: ConfigService,
  useValue: {},
};

export const JwtServiceMock = {
  provide: JwtService,
  useValue: {},
};

export const OrganizationsServiceMock = {
  provide: OrganizationsService,
  useValue: {
    create: jest.fn(),
    findAll: jest.fn(),
    findbyId: jest.fn(),
  },
};

describe("OrganizationsController", () => {
  let controller: OrganizationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganizationsController],
      providers: [OrganizationsServiceMock, JwtServiceMock, ConfigServiceMock],
    }).compile();

    controller = module.get<OrganizationsController>(OrganizationsController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("create", () => {
    it("should return org created", async () => {
      const organizationDto: CreateOrganizationDto = { name: "Org Test" };

      const mockedRequest = {
        user: {
          id: "uuid",
          name: "name",
        },
      } as AuthenticatedRequest;

      const mockedNewOrg: Organization = {
        created_at: new Date(),
        id: "uuid",
        name: "Org Test",
        updated_at: new Date(),
        owner_id: "uuid",
      };

      const handler = controller["create"](mockedRequest);

      jest.spyOn(OrganizationsServiceMock.useValue, "create").mockResolvedValue(mockedNewOrg);

      const result = await handler({
        headers: {
          "content-type": "application/json",
        },
        body: organizationDto,
      });

      expect(result).toEqual({
        status: 200,
        body: mockedNewOrg,
      });
    });
  });

  describe("findAll", () => {
    it("should return all orgs", async () => {
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

      const handler = controller["findAll"]();

      jest.spyOn(OrganizationsServiceMock.useValue, "findAll").mockResolvedValue(mockedResponse);

      const result = await handler({
        query: {
          limit: 10,
          offset: 0,
        },
        headers: {
          "content-type": "application/json",
        },
      });

      expect(result).toEqual({
        status: 200,
        body: mockedResponse,
      });
    });
  });

  describe("findbyId", () => {
    it("should return org by id", async () => {
      const mockedOrg: Organization = {
        created_at: new Date(),
        id: "uuid",
        name: "Org Test",
        updated_at: new Date(),
        owner_id: "uuid",
      };

      const handler = controller["findbyId"]();

      jest.spyOn(OrganizationsServiceMock.useValue, "findbyId").mockResolvedValue(mockedOrg);

      const result = await handler({
        params: {
          id: "uuid",
        },
        headers: {
          "content-type": "application/json",
        },
      });

      expect(result).toEqual({
        status: 200,
        body: mockedOrg,
      });
    });
  });
});
