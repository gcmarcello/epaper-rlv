import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { BucketService } from "../bucket.service";

describe("BucketService (Integration)", () => {
  let bucketService: BucketService;

  const testBucketName = "test-bucket";
  const testFileKey = "test-file.txt";
  const testFileContent = Buffer.from("Hello, MinIO!");
  const testFileMimeType = "text/plain";

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BucketService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const env = {
                MINIO_ENDPOINT: process.env.MINIO_ENDPOINT ?? "http://host.docker.internal:9000",
                MINIO_ROOT_USER: "admin",
                MINIO_ROOT_PASSWORD: "admin1234",
              };
              return env[key];
            }),
          },
        },
      ],
    }).compile();

    bucketService = module.get<BucketService>(BucketService);

    await bucketService.createBucketIfNotExists(testBucketName);
  });

  afterAll(async () => {
    await bucketService.deleteFile(testBucketName, testFileKey);
    await bucketService.deleteBucket(testBucketName);
  });

  it("should upload a file to the bucket", async () => {
    const key = await bucketService.uploadFile(
      testBucketName,
      testFileKey,
      testFileContent,
      testFileMimeType
    );

    expect(key).toBe(testFileKey);
  });

  it("should retrieve a file from the bucket", async () => {
    const readable = await bucketService.getFile(testBucketName, testFileKey);

    const chunks: Buffer[] = [];
    for await (const chunk of readable) {
      chunks.push(Buffer.from(chunk));
    }

    const fileContent = Buffer.concat(chunks).toString();
    expect(fileContent).toBe(testFileContent.toString());
  });

  it("should generate a signed URL for the file", async () => {
    const signedUrl = await bucketService.getFileUrl(testBucketName, testFileKey);
    expect(typeof signedUrl).toBe("string");
    expect(signedUrl).toContain(testFileKey);
  });
});
