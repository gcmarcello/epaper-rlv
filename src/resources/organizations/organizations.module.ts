import { Module } from "@nestjs/common";
import { OrganizationsService } from "./organizations.service";
import { OrganizationsController } from "./organizations.controller";
import { DBModule } from "@/common/db/db.module";
import { ConfigModule } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";

@Module({
  imports: [DBModule, ConfigModule],
  controllers: [OrganizationsController],
  providers: [OrganizationsService, JwtService],
})
export class OrganizationsModule {}
