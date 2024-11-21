import { Module } from "@nestjs/common";
import { FilesService } from "./files.service";
import { FilesController } from "./files.controller";
import { DBModule } from "@/common/db/db.module";
import { BucketService } from "@/common/bucket/bucket.service";
import { BucketModule } from "@/common/bucket/bucket.module";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";

@Module({
  imports: [DBModule, BucketModule, ConfigModule, JwtModule],
  controllers: [FilesController],
  providers: [FilesService, BucketService],
})
export class FilesModule {}
