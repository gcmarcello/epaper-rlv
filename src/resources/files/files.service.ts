import { Inject, Injectable } from "@nestjs/common";
import { DrizzleAsyncProvider } from "@/common/db/db.provider";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "@/common/db/db.schema";
import { BucketService } from "@/common/bucket/bucket.service";
import { FileOrigin, FileType } from "./entities/file.entity";
import { and, eq } from "drizzle-orm";
import { TsRestException } from "@ts-rest/nest";
import { fileContract } from "./files.contract";

@Injectable()
export class FilesService {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: NodePgDatabase<typeof schema>,
    private bucket: BucketService
  ) {}

  async create(
    createFileDto: Express.Multer.File,
    data: {
      name: string;
      user_id: string;
      organization_id: string;
      file_origin: FileOrigin;
      file_type: FileType;
    }
  ) {
    const file_key = await this.bucket.uploadFile(createFileDto);

    return (
      await this.db
        .insert(schema.files)
        .values({
          name: data.name,
          user_id: data.user_id,
          organization_id: data.organization_id,
          file_origin: data.file_origin,
          file_type: data.file_type,
          file_key,
        })
        .returning()
    )[0].file_key;
  }

  async findById(id: number, orgId?: string) {
    if (!orgId) {
      throw new TsRestException(fileContract.getFile, {
        status: 404,
        body: { message: "No Active Org" },
      });
    }

    const file = await this.db.query.files.findFirst({
      where: and(eq(schema.files.id, id), eq(schema.files.organization_id, orgId)),
    });

    if (!file)
      throw new TsRestException(fileContract.getFile, {
        status: 404,
        body: { message: "No File Found" },
      });

    return this.bucket.getFileUrl(file.file_key);
  }
}
