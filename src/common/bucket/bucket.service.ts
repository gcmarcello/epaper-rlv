import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as Minio from "minio";

@Injectable()
export class BucketService {
  private minioClient: Minio.Client;
  private bucketName: string;

  constructor(private readonly configService: ConfigService) {
    this.minioClient = new Minio.Client({
      endPoint: this.configService.get<string>("MINIO_ENDPOINT") ?? "localhost",
      port: Number(this.configService.get("MINIO_PORT")),
      useSSL: this.configService.get("MINIO_USE_SSL") === "true",
      accessKey: this.configService.get("MINIO_ACCESS_KEY") ?? "admin",
      secretKey: this.configService.get("MINIO_SECRET_KEY") ?? "admin",
    });
    this.bucketName = this.configService.get("MINIO_BUCKET_NAME") ?? "epaper";
  }

  async createBucketIfNotExists() {
    const bucketExists = await this.minioClient.bucketExists(this.bucketName);
    if (!bucketExists) {
      await this.minioClient.makeBucket(this.bucketName);
    }
  }

  async uploadFile(file: Express.Multer.File) {
    await this.createBucketIfNotExists();
    const fileName = `${Date.now()}-${file.originalname}`;
    await this.minioClient.putObject(this.bucketName, fileName, file.buffer, file.size);
    return fileName;
  }

  async getFileUrl(fileName: string) {
    return await this.minioClient.presignedUrl("GET", this.bucketName, fileName);
  }
}
