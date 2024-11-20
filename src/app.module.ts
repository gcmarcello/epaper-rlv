import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { FilesModule } from "./resources/files/files.module";
import { DBModule } from "./common/db/db.module";
import { ConfigModule } from "@nestjs/config";

@Module({
  imports: [ConfigModule.forRoot(), FilesModule, DBModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
