import { Test } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../../../app.module";
import { DrizzleAsyncProvider } from "../../../common/db/db.provider";
import * as schema from "../../../common/db/db.schema";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { hash } from "@/utils/bcrypt";
import { FileOrigin, FileType } from "../entities/file.entity";
import * as path from "path";
import * as fs from "fs";
import { eq } from "drizzle-orm";
import { BucketService } from "@/common/bucket/bucket.service";

describe("Files (e2e)", () => {
  let app: INestApplication;
  let db: NodePgDatabase<typeof schema>;
  let testUser: any;
  let testOrg: any;
  let authToken: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    db = moduleRef.get(DrizzleAsyncProvider);
    await app.init();

    const bucketService = app.get(BucketService);

    const bucketExists = await bucketService.bucketExists();
    if (bucketExists) {
      await bucketService.emptyBucket();
      await bucketService.deleteBucket();
    }
    await bucketService.createBucket();

    // Clear the database
    await db.delete(schema.files);
    await db.delete(schema.userOrganizations);
    await db.delete(schema.organizations);
    await db.delete(schema.users);

    // Create test user
    const hashedPassword = await hash("test123");
    testUser = await db
      .insert(schema.users)
      .values({
        email: "test@example.com",
        password: hashedPassword,
        name: "Test User",
      })
      .returning();

    // Create test organization
    testOrg = await db
      .insert(schema.organizations)
      .values({
        name: "Test Org",
        owner_id: testUser[0].id,
      })
      .returning();

    // Associate user with organization
    await db.insert(schema.userOrganizations).values({
      user_id: testUser[0].id,
      organization_id: testOrg[0].id,
    });

    // Get auth token
    const response = await request(app.getHttpServer()).post("/auth/login").send({
      email: "test@example.com",
      password: "test123",
    });
    authToken = response.body.token;

    const activateOrganization = await request(app.getHttpServer())
      .post("/auth/organization")
      .set("Authorization", `${authToken}`)
      .send({
        organizationId: testOrg[0].id,
      });

    authToken = activateOrganization.body.token;
  });

  afterAll(async () => {
    await db.delete(schema.files);
    await db.delete(schema.userOrganizations);
    await db.delete(schema.organizations);
    await db.delete(schema.users);
    await app.close();
  });

  describe("POST /files", () => {
    it("should upload a file successfully", () => {
      const testFilePath = path.join(__dirname, "test-file.txt");
      fs.writeFileSync(testFilePath, "test content");

      request(app.getHttpServer())
        .post("/files")
        .set("Authorization", `${authToken}`)
        .attach("file", testFilePath)
        .field("name", "Test File")
        .field("file_origin", FileOrigin.DIGITAL)
        .field("file_type", FileType.INVOICE)
        .expect((res) => {
          expect(res.body.message).toBe("test-file.txt");
        })
        .expect(200);

      return fs.unlinkSync(testFilePath);
    });

    it("should fail without authentication", () => {
      return request(app.getHttpServer()).post("/files").expect(401);
    });

    it("should fail invalid organization", async () => {
      const testFilePath = path.join(__dirname, "test-file.txt");
      fs.writeFileSync(testFilePath, "test content");

      // Create test organization
      const testOrg2 = await db
        .insert(schema.organizations)
        .values({
          name: "Test Org2",
          owner_id: testUser[0].id,
        })
        .returning();

      // Associate user with organization
      await db.insert(schema.userOrganizations).values({
        user_id: testUser[0].id,
        organization_id: testOrg2[0].id,
      });

      const activateOrganization = await request(app.getHttpServer())
        .post("/auth/organization")
        .set("Authorization", `${authToken}`)
        .send({
          organizationId: testOrg2[0].id,
        });

      const invalidAuthToken = activateOrganization.body.token;

      await db
        .delete(schema.userOrganizations)
        .where(eq(schema.userOrganizations.organization_id, testOrg2[0].id));
      await db.delete(schema.organizations).where(eq(schema.organizations.id, testOrg2[0].id));

      request(app.getHttpServer())
        .post("/files")
        .set("Authorization", `${invalidAuthToken}`)
        .attach("file", testFilePath)
        .field("name", "Test File")
        .field("file_origin", FileOrigin.DIGITAL)
        .field("file_type", FileType.INVOICE)
        .expect(404);

      return fs.unlinkSync(testFilePath);
    });
  });

  describe("GET /files", () => {
    it("should get all files when authenticated", () => {
      return request(app.getHttpServer())
        .get("/files")
        .set("Authorization", `${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.files).toBeDefined();
          expect(Array.isArray(res.body.files)).toBeTruthy();
          expect(res.body.total).toBeDefined();
        });
    });

    it("should support filtering files", () => {
      return request(app.getHttpServer())
        .get("/files")
        .query({
          file_type: FileType.INVOICE,
          date_start: "2021-01-01",
          date_end: "2030-12-31",
          file_origin: FileOrigin.DIGITAL,
          gross_value: 100,
          net_value: 100,
          user_name: "Test User",
          name: "File",
          limit: 5,
          offset: 0,
        })
        .set("Authorization", `${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.files).toBeDefined();
          expect(Array.isArray(res.body.files)).toBeTruthy();
        });
    });

    it("should fail without authentication", () => {
      return request(app.getHttpServer()).get("/files").expect(401);
    });
  });

  describe("GET /files/:id", () => {
    let testFileId: number;

    beforeAll(async () => {
      const file = await db
        .insert(schema.files)
        .values({
          name: "Test File",
          user_id: testUser[0].id,
          organization_id: testOrg[0].id,
          file_origin: FileOrigin.DIGITAL,
          file_type: FileType.INVOICE,
          file_key: "test-key",
        })
        .returning();
      testFileId = file[0].id;
    });

    it("should get file by id when authenticated", () => {
      return request(app.getHttpServer())
        .get(`/files/${testFileId}`)
        .set("Authorization", `${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.url).toBeDefined();
        });
    });

    it("should fail when file does not exist", () => {
      return request(app.getHttpServer())
        .get("/files/99999")
        .set("Authorization", `${authToken}`)
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toBe("No File Found");
        });
    });

    it("should fail without authentication", () => {
      return request(app.getHttpServer()).get(`/files/${testFileId}`).expect(401);
    });
  });

  describe("PATCH /files/:id", () => {
    let testFileId: number;

    beforeAll(async () => {
      const file = await db
        .insert(schema.files)
        .values({
          name: "Test File",
          user_id: testUser[0].id,
          organization_id: testOrg[0].id,
          file_origin: FileOrigin.DIGITAL,
          file_type: FileType.INVOICE,
          file_key: "test-key",
        })
        .returning();
      testFileId = file[0].id;
    });

    it("should update file successfully when authenticated", () => {
      const testFilePath = path.join(__dirname, "test-update-file.txt");
      fs.writeFileSync(testFilePath, "updated content");

      return request(app.getHttpServer())
        .patch(`/files/${testFileId}`)
        .set("Authorization", `${authToken}`)
        .attach("file", testFilePath)
        .field("name", "Updated Test File")
        .field("file_origin", FileOrigin.DIGITAL)
        .field("file_type", FileType.RECEIPT)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe("Arquivo Atualizado");
          fs.unlinkSync(testFilePath);
        });
    });

    it("should fail when trying to update non-existent file", () => {
      const testFilePath = path.join(__dirname, "test-update-file.txt");
      fs.writeFileSync(testFilePath, "updated content");

      return request(app.getHttpServer())
        .patch(`/files/99999`)
        .set("Authorization", `${authToken}`)
        .attach("file", testFilePath)
        .field("name", "Updated Test File")
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toBe("No File Found");
          fs.unlinkSync(testFilePath);
        });
    });

    it("should fail without authentication", () => {
      return request(app.getHttpServer()).patch(`/files/${testFileId}`).expect(401);
    });
  });
});
