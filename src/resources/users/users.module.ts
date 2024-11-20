import { Module } from "@nestjs/common";
import { UsersService } from "./users.service";
import { UsersController } from "./users.controller";
import { DBModule } from "src/common/db/db.module";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";

@Module({
  imports: [DBModule, ConfigModule],
  controllers: [UsersController],
  providers: [UsersService, ConfigService, JwtService],
})
export class UsersModule {}
