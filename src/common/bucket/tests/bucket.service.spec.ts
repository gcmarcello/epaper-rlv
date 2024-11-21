import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { BucketService } from "../bucket.service";
import * as Minio from "minio";
import { BucketModule } from "../bucket.module";

jest.mock("minio");

describe("BucketService", () => {
  let service: BucketService;
  let minioClientMock: jest.Mocked<Minio.Client>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [BucketModule],
      providers: [
        BucketService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              switch (key) {
                case "MINIO_ENDPOINT":
                  return "localhost";
                case "MINIO_PORT":
                  return "9000";
                case "MINIO_USE_SSL":
                  return "false";
                case "MINIO_ACCESS_KEY":
                  return "admin";
                case "MINIO_SECRET_KEY":
                  return "admin";
                case "MINIO_BUCKET_NAME":
                  return "epaper";
                default:
                  return null;
              }
            }),
          },
        },
      ],
    }).compile();

    service = module.get<BucketService>(BucketService);

    minioClientMock = {
      bucketExists: jest.fn(),
      makeBucket: jest.fn(),
      putObject: jest.fn(),
      presignedUrl: jest.fn(),
    } as unknown as jest.Mocked<Minio.Client>;

    service["minioClient"] = minioClientMock;
  });

  describe("createBucketIfNotExists", () => {
    it("should create bucket if it does not exist", async () => {
      minioClientMock.bucketExists.mockResolvedValue(false);
      minioClientMock.makeBucket.mockResolvedValue(undefined);

      await service.createBucketIfNotExists();

      expect(minioClientMock.bucketExists).toHaveBeenCalledWith("epaper");
      expect(minioClientMock.makeBucket).toHaveBeenCalledWith("epaper");
    });

    it("should not create bucket if it exists", async () => {
      minioClientMock.bucketExists.mockResolvedValue(true);

      await service.createBucketIfNotExists();

      expect(minioClientMock.bucketExists).toHaveBeenCalledWith("epaper");
      expect(minioClientMock.makeBucket).not.toHaveBeenCalled();
    });
  });

  describe("uploadFile", () => {
    it("should upload file to bucket", async () => {
      const file = {
        originalname: "test.txt",
        buffer: Buffer.from("test content"),
        size: 12,
      } as Express.Multer.File;

      jest.spyOn(service, "createBucketIfNotExists").mockResolvedValue(undefined);
      minioClientMock.putObject.mockResolvedValue(undefined as any);

      const fileName = await service.uploadFile(file);

      expect(service.createBucketIfNotExists).toHaveBeenCalled();
      expect(minioClientMock.putObject).toHaveBeenCalledWith(
        "epaper",
        expect.stringMatching(/^\d+-test\.txt$/),
        file.buffer,
        file.size
      );
      expect(fileName).toMatch(/^\d+-test\.txt$/);
    });
  });

  describe("getFileUrl", () => {
    it("should return presigned URL for file", async () => {
      const fileName = "test.txt";
      const presignedUrl = "http://localhost:9000/epaper/test.txt";

      minioClientMock.presignedUrl.mockResolvedValue(presignedUrl);

      const url = await service.getFileUrl(fileName);

      expect(minioClientMock.presignedUrl).toHaveBeenCalledWith("GET", "epaper", fileName);
      expect(url).toBe(presignedUrl);
    });
  });
});
