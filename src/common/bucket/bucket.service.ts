import { Injectable } from "@nestjs/common";
import {
  S3,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ConfigService } from "@nestjs/config";
import { Readable } from "stream";

@Injectable()
export class BucketService {
  private s3: S3;

  constructor(private readonly configService: ConfigService) {
    this.s3 = new S3({
      endpoint: this.configService.get<string>("MINIO_ENDPOINT"),
      region: "us-east-1",
      credentials: {
        accessKeyId: this.configService.get("MINIO_ROOT_USER") ?? "admin",
        secretAccessKey: this.configService.get("MINIO_ROOT_PASSWORD") ?? "admin",
      },
      forcePathStyle: true, // Required for MinIO
    });
  }

  async uploadFile(bucket: string, key: string, file: Buffer, mimeType: string) {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file,
      ContentType: mimeType,
    });

    await this.s3.send(command);

    return key;
  }

  async getFile(bucket: string, key: string) {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const response = await this.s3.send(command);
    if (!response.Body || !(response.Body instanceof Readable)) {
      throw new Error("Unable to retrieve file from MinIO");
    }
    return response.Body as Readable;
  }

  async deleteFile(bucket: string, key: string) {
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    await this.s3.send(command);
  }

  async getFileUrl(bucket: string, key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const signedUrl = await getSignedUrl(this.s3, command, { expiresIn });

    return signedUrl;
  }

  async createBucketIfNotExists(bucketName: string): Promise<void> {
    try {
      await this.s3.send(new HeadBucketCommand({ Bucket: bucketName }));
    } catch {
      await this.s3.send(new CreateBucketCommand({ Bucket: bucketName }));
    }
  }
}
