import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { FilesModule } from "./resources/files/files.module";
import { DBModule } from "./common/db/db.module";
import { ConfigModule } from "@nestjs/config";
import { UsersModule } from "./resources/users/users.module";
import { OrganizationsModule } from "./resources/organizations/organizations.module";

@Module({
  imports: [ConfigModule.forRoot(), DBModule, FilesModule, UsersModule, OrganizationsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
