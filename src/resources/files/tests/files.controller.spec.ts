import { Test, TestingModule } from "@nestjs/testing";
import { FilesController } from "../files.controller";
import { FilesService } from "../files.service";
import { AuthGuard } from "../../auth/auth.guard";
import { AuthenticatedRequest } from "@/types/authenticatedRequest";
import { File, FileOrigin, FileType } from "../entities/file.entity";

describe("FilesController", () => {
  let controller: FilesController;
  let service: FilesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FilesController],
      providers: [
        {
          provide: FilesService,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            find: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<FilesController>(FilesController);
    service = module.get<FilesService>(FilesService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("create", () => {
    it("should create a file", async () => {
      const request = { user: { id: "userId", organizationId: "orgId" } };
      const file = { originalname: "test.txt" } as Express.Multer.File;
      const body = {
        file_origin: FileOrigin.DIGITAL,
        file_type: FileType.BILL,
        net_value: 100,
        gross_value: 120,
        name: "fileName",
      };
      const mockedResult = { status: 200, body: { message: "fileKey" } };

      jest.spyOn(service, "create").mockResolvedValue("fileKey");

      const result = await service.create(file, {
        ...body,
        user_id: request.user.id,
        organization_id: request.user.organizationId,
      });

      expect(service.create).toHaveBeenCalledWith(file, {
        ...body,
        user_id: request.user.id,
        organization_id: request.user.organizationId,
      });

      expect(mockedResult).toEqual({ status: 200, body: { message: result } });
    });
  });

  describe("getFile", () => {
    it("should get a file by id", async () => {
      const request = { user: { organizationId: "orgId" } } as AuthenticatedRequest;
      const params = { id: 1 };
      const url = "fileUrl";

      jest.spyOn(service, "findById").mockResolvedValue(url);

      const result = await controller.getFile(request)({ params, headers: {} });

      expect(service.findById).toHaveBeenCalledWith(params.id, request.user.organizationId);
      expect(result).toEqual({ status: 200, body: { url } });
    });
  });

  describe("getFiles", () => {
    it("should get files", async () => {
      const request = { user: { organizationId: "orgId" } } as AuthenticatedRequest;
      const query = {
        file_origin: FileOrigin.DIGITAL,
        file_type: FileType.BILL,
        limit: 10,
        offset: 0,
      };
      const data: { files: (File & { user: { name: string } | null })[]; total: number } = {
        files: [
          {
            id: 1,
            created_at: new Date(),
            updated_at: new Date(),
            name: "test.txt",
            user_id: "userId",
            organization_id: "orgId",
            file_origin: FileOrigin.DIGITAL,
            file_type: FileType.BILL,
            file_key: "fileKey",
            net_value: 100,
            gross_value: 120,
            user: { name: "userName" },
          },
        ],
        total: 1,
      };

      jest.spyOn(service, "find").mockResolvedValue(data);

      const result = await controller.getFiles(request)({ query, headers: {} });

      expect(service.find).toHaveBeenCalledWith(query, request.user.organizationId);
      expect(result).toEqual({ status: 200, body: data });
    });
  });

  describe("updateFile", () => {
    it("should update a file", async () => {
      const request = { user: { id: "userId", organizationId: "orgId" } };
      const file = { originalname: "test.txt" } as Express.Multer.File;
      const body = {
        file_origin: FileOrigin.DIGITAL,
        file_type: FileType.BILL,
        net_value: 100,
        gross_value: 120,
        name: "fileName",
        user_id: "userId",
      };
      const params = { id: 1 };
      const mockedResult = { status: 200, body: { message: "Arquivo Atualizado" } };

      jest.spyOn(service, "update").mockResolvedValue("Arquivo Atualizado");

      await service.update(params.id, file, {
        ...body,
        organization_id: request.user.organizationId,
      });

      expect(service.update).toHaveBeenCalledWith(params.id, file, {
        ...body,
        user_id: request.user.id,
        organization_id: request.user.organizationId,
      });

      expect(mockedResult).toEqual({ status: 200, body: { message: "Arquivo Atualizado" } });
    });
  });
});
