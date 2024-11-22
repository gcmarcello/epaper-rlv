import { Test, TestingModule } from "@nestjs/testing";
import { FilesService } from "../files.service";
import { DrizzleAsyncProvider } from "@/common/db/db.provider";
import { BucketService } from "@/common/bucket/bucket.service";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "@/common/db/db.schema";
import { File, FileOrigin, FileType } from "../entities/file.entity";
import { TsRestException } from "@ts-rest/nest";
import { fileContract } from "../files.contract";
import { FindFileDto } from "../dto/find-file.dto";

describe("FilesService", () => {
  let service: FilesService;
  let db: NodePgDatabase<typeof schema>;
  let bucket: BucketService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        {
          provide: DrizzleAsyncProvider,
          useValue: {
            insert: jest.fn(),
            query: {
              files: {
                findFirst: jest.fn(),
              },
            },
            select: jest.fn(),
            $count: jest.fn(),
          },
        },
        {
          provide: BucketService,
          useValue: {
            uploadFile: jest.fn(),
            getFileUrl: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<FilesService>(FilesService);
    db = module.get<NodePgDatabase<typeof schema>>(DrizzleAsyncProvider);
    bucket = module.get<BucketService>(BucketService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create a file and return its key", async () => {
      const createFileDto = {
        originalname: "test",
        buffer: Buffer.from("test"),
        mimetype: "text/plain",
      } as Express.Multer.File;
      const data = {
        name: "test",
        user_id: "user1",
        organization_id: "org1",
        file_origin: FileOrigin.DIGITAL,
        file_type: FileType.WORK_ORDER,
        net_value: 100,
        gross_value: 120,
      };

      const fileKey = "file_key";
      jest.spyOn(bucket, "uploadFile").mockResolvedValue(fileKey);
      jest.spyOn(db, "insert").mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([{ file_key: fileKey }]),
        }),
      } as any);

      const result = await service.create(createFileDto, data);

      expect(result).toBe(fileKey);
      expect(bucket.uploadFile).toHaveBeenCalledWith(
        "epaper",
        createFileDto.originalname,
        createFileDto.buffer,
        createFileDto.mimetype
      );
      expect(db.insert).toHaveBeenCalledWith(schema.files);
    });
  });

  describe("findById", () => {
    it("should throw an exception if no orgId is provided", async () => {
      await expect(service.findById(1)).rejects.toThrow(
        new TsRestException(fileContract.getFile, {
          status: 404,
          body: { message: "No Active Org" },
        })
      );
    });

    it("should return file URL if file is found", async () => {
      const file: File = {
        file_key: "file_key",
        organization_id: "org1",
        created_at: new Date(),
        file_origin: FileOrigin.DIGITAL,
        file_type: FileType.WORK_ORDER,
        gross_value: 100,
        id: 1,
        name: "test",
        net_value: 80,
        updated_at: new Date(),
        user_id: "user1",
      };
      jest.spyOn(db.query.files, "findFirst").mockResolvedValue(file);
      jest.spyOn(bucket, "getFileUrl").mockResolvedValue("file_url");

      const result = await service.findById(1, "org1");

      expect(result).toBe("file_url");
      expect(db.query.files.findFirst).toHaveBeenCalledWith({
        where: expect.any(Object),
      });
      expect(bucket.getFileUrl).toHaveBeenCalledWith("epaper", file.file_key);
    });

    it("should throw an exception if file is not found", async () => {
      jest.spyOn(db.query.files, "findFirst").mockResolvedValue(undefined);

      await expect(service.findById(1, "org1")).rejects.toThrow(
        new TsRestException(fileContract.getFile, {
          status: 404,
          body: { message: "No File Found" },
        })
      );
    });
  });

  describe("find", () => {
    it("should throw an exception if no organization_id is provided", async () => {
      const query: FindFileDto = {
        limit: 10,
        offset: 0,
      };

      await expect(service.find(query)).rejects.toThrow(
        new TsRestException(fileContract.getFile, {
          status: 404,
          body: { message: "No Active Org" },
        })
      );
    });

    it("should return files and count", async () => {
      const query: FindFileDto = { limit: 10, offset: 0 };
      const organization_id = "org1";
      const dbData: { files: File[]; users: { name: string } | null }[] = [
        {
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
            },
          ],
          users: { name: "userName" },
        },
        {
          files: [
            {
              id: 2,
              created_at: new Date(),
              updated_at: new Date(),
              name: "test.pdf",
              user_id: "userId",
              organization_id: "orgId",
              file_origin: FileOrigin.DIGITIZED,
              file_type: FileType.SICK_NOTE,
              file_key: "fileKey",
              net_value: 100,
              gross_value: 120,
            },
          ],
          users: { name: "userName" },
        },
      ];
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
          {
            id: 2,
            created_at: new Date(),
            updated_at: new Date(),
            name: "test.pdf",
            user_id: "userId",
            organization_id: "orgId",
            file_origin: FileOrigin.DIGITIZED,
            file_type: FileType.SICK_NOTE,
            file_key: "fileKey",
            net_value: 100,
            gross_value: 120,
            user: { name: "userName" },
          },
        ],
        total: 2,
      };

      jest.spyOn(db, "select").mockReturnValue({
        from: jest.fn().mockReturnValue({
          leftJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                offset: jest.fn().mockReturnValue(dbData),
              }),
            }),
          }),
        }),
      } as any);
    });
  });
});
