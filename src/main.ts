import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { SwaggerModule } from "@nestjs/swagger";
import { generateOpenApi } from "@ts-rest/open-api";
import { userContract } from "./resources/users/users.contract";
import { organizationContract } from "./resources/organizations/organizations.contract";
import { authContract } from "./resources/auth/auth.contract";
import { BucketService } from "./common/bucket/bucket.service";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const bucketService = app.get(BucketService);

  const bucketExists = await bucketService.bucketExists();
  if (bucketExists) {
    await bucketService.emptyBucket();
    await bucketService.deleteBucket();
  }
  await bucketService.createBucket();

  const document = generateOpenApi(
    { auth: authContract, users: userContract, organizations: organizationContract },
    {
      info: {
        title: "EPaper API",
        version: "1.0.0",
        description: "API para teste técnico da RLV tecnologia.",
      },
    }
  );

  SwaggerModule.setup("api-docs", app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
