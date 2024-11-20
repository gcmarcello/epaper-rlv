import { Module } from "@nestjs/common";
import { DrizzleAsyncProvider, DrizzleProvider } from "./db.provider";
import { ConfigService } from "@nestjs/config";

@Module({
  providers: [DrizzleProvider, ConfigService],
  exports: [DrizzleAsyncProvider],
})
export class DBModule {}
