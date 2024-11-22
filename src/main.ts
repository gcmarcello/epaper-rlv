import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { SwaggerModule } from "@nestjs/swagger";
import { generateOpenApi } from "@ts-rest/open-api";
import { userContract } from "./resources/users/users.contract";
import { organizationContract } from "./resources/organizations/organizations.contract";
import { authContract } from "./resources/auth/auth.contract";
import { BucketService } from "./common/bucket/bucket.service";
import { fileContract } from "./resources/files/files.contract";
import { hasCustomTags, hasSecurity } from "./utils/openapi";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const bucketService = app.get(BucketService);

  const bucketExists = await bucketService.bucketExists();
  if (bucketExists) {
    await bucketService.emptyBucket();
    await bucketService.deleteBucket();
  }
  await bucketService.createBucket();

  const apiDoc = generateOpenApi(
    {
      Auth: authContract,
      Users: userContract,
      Organizations: organizationContract,
      Files: fileContract,
    },
    {
      info: { title: "EPaper API", version: "1.0", description: "API para o teste técnico RLV" },
      components: {
        securitySchemes: {
          BearerAuth: {
            type: "http",
            scheme: "bearer",
          },
        },
      },
    },
    {
      operationMapper: (operation, appRoute) => ({
        ...operation,
        ...(hasCustomTags(appRoute.metadata)
          ? {
              tags: appRoute.metadata.openApiTags,
            }
          : {}),
        ...(hasSecurity(appRoute.metadata)
          ? {
              security: appRoute.metadata.openApiSecurity,
            }
          : {}),
      }),
    }
  );

  SwaggerModule.setup("api-docs", app, apiDoc);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
