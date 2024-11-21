import { Module } from "@nestjs/common";
import { BucketService } from "./bucket.service";
import { ConfigService } from "@nestjs/config";

@Module({
  providers: [BucketService, ConfigService],
})
export class BucketModule {}
