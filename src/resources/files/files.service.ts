import { Inject, Injectable } from "@nestjs/common";
import { DrizzleAsyncProvider } from "@/common/db/db.provider";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "@/common/db/db.schema";
import { BucketService } from "@/common/bucket/bucket.service";
import { FileOrigin, FileType } from "./entities/file.entity";
import { and, eq, gte, ilike, lte, SQL } from "drizzle-orm";
import { TsRestException } from "@ts-rest/nest";
import { fileContract } from "./files.contract";
import { FindFileDto } from "./dto/find-file.dto";

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
      organization_id?: string;
      file_origin: FileOrigin;
      file_type: FileType;
      net_value?: number;
      gross_value?: number;
    }
  ) {
    const file_key = await this.bucket.uploadFile(
      "epaper",
      createFileDto.originalname,
      createFileDto.buffer,
      createFileDto.mimetype
    );

    const doesOrgExist = data.organization_id
      ? await this.db.query.organizations.findFirst({
          where: eq(schema.organizations.id, data.organization_id),
        })
      : false;

    if (!doesOrgExist)
      throw new TsRestException(fileContract.createFile, {
        status: 404,
        body: { message: "No Organization Found" },
      });

    return (
      await this.db
        .insert(schema.files)
        .values({
          name: data.name,
          user_id: data.user_id,
          organization_id: data.organization_id!,
          file_origin: data.file_origin,
          file_type: data.file_type,
          file_key,
          net_value: data.net_value,
          gross_value: data.gross_value,
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

    return this.bucket.getFileUrl("epaper", file.file_key);
  }

  async find(query: FindFileDto, organization_id?: string) {
    if (!organization_id) {
      throw new TsRestException(fileContract.getFile, {
        status: 404,
        body: { message: "No Active Org" },
      });
    }
    const {
      limit = 10,
      offset = 0,
      date_end,
      date_start,
      file_origin,
      file_type,
      gross_value,
      net_value,
      user_name,
      name,
    } = query;

    const conditions: SQL<unknown>[] = [];

    if (organization_id) {
      conditions.push(eq(schema.files.organization_id, organization_id));
    }
    if (name) {
      conditions.push(ilike(schema.files.name, `%${name}%`));
    }
    if (date_start) {
      conditions.push(gte(schema.files.created_at, new Date(date_start)));
    }
    if (date_end) {
      conditions.push(lte(schema.files.created_at, new Date(date_end)));
    }
    if (file_origin) {
      conditions.push(eq(schema.files.file_origin, file_origin));
    }
    if (file_type) {
      conditions.push(eq(schema.files.file_type, file_type));
    }
    if (gross_value) {
      conditions.push(eq(schema.files.gross_value, gross_value));
    }
    if (net_value) {
      conditions.push(eq(schema.files.net_value, net_value));
    }
    if (user_name) {
      conditions.push(ilike(schema.users.name, `%${user_name}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await this.db
      .select({ files: schema.files, users: { name: schema.users.name } })
      .from(schema.files)
      .leftJoin(schema.users, eq(schema.files.user_id, schema.users.id))
      .where(whereClause)
      .limit(limit)
      .offset(offset);

    let total = results.length;

    if (conditions.length === 1)
      total = await this.db.$count(schema.files, eq(schema.files.organization_id, organization_id));

    return {
      files: results.map((file) => ({ ...file.files, user: file.users })),
      total,
    };
  }
}
