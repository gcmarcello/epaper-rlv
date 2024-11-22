import { Test } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../../../app.module";
import { DrizzleAsyncProvider } from "../../../common/db/db.provider";
import * as schema from "../../../common/db/db.schema";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { hash } from "@/utils/bcrypt";

describe("Organizations (e2e)", () => {
  let app: INestApplication;
  let db: NodePgDatabase<typeof schema>;
  let testUser: any;
  let authToken: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    db = moduleRef.get(DrizzleAsyncProvider);
    await app.init();

    await db.delete(schema.files);
    await db.delete(schema.userOrganizations);
    await db.delete(schema.organizations);
    await db.delete(schema.users);

    const hashedPassword = await hash("test123");
    testUser = await db
      .insert(schema.users)
      .values({
        email: "test@example.com",
        password: hashedPassword,
        name: "Test User",
      })
      .returning();

    const response = await request(app.getHttpServer()).post("/auth/login").send({
      email: "test@example.com",
      password: "test123",
    });
    authToken = response.body.token;
  });

  afterAll(async () => {
    await db.delete(schema.files);
    await db.delete(schema.userOrganizations);
    await db.delete(schema.organizations);
    await db.delete(schema.users);
    await app.close();
  });

  describe("POST /organizations", () => {
    it("should create a new organization successfully when authenticated", () => {
      return request(app.getHttpServer())
        .post("/organizations")
        .set("Authorization", `${authToken}`)
        .send({
          name: "Test Organization",
          description: "Test Description",
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBeDefined();
          expect(res.body.name).toBe("Test Organization");
          expect(res.body.owner_id).toBe(testUser[0].id);
        });
    });

    it("should fail without authentication", () => {
      return request(app.getHttpServer())
        .post("/organizations")
        .send({
          name: "Test Organization",
        })
        .expect(401);
    });
  });

  describe("GET /organizations", () => {
    it("should get all organizations", () => {
      return request(app.getHttpServer())
        .get("/organizations")
        .expect(200)
        .expect((res) => {
          expect(res.body.organizations).toBeDefined();
          expect(Array.isArray(res.body.organizations)).toBeTruthy();
          expect(res.body.total).toBeDefined();
        });
    });
  });

  describe("GET /organizations/:id", () => {
    let testOrg: any;

    beforeAll(async () => {
      testOrg = await db
        .insert(schema.organizations)
        .values({
          name: "Test Org",
          owner_id: testUser[0].id,
        })
        .returning();
    });

    it("should get organization by id", () => {
      return request(app.getHttpServer())
        .get(`/organizations/${testOrg[0].id}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe("Test Org");
          expect(res.body.id).toBe(testOrg[0].id);
          expect(res.body.owner_id).toBe(testUser[0].id);
        });
    });

    it("should fail when organization does not exist", () => {
      return request(app.getHttpServer())
        .get("/organizations/e83192ee-a669-48fd-8cd1-48ac4a524657")
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toBe("No Org Found");
        });
    });

    it("should fail with invalid id format", () => {
      return request(app.getHttpServer()).get("/organizations/invalid-id").expect(400);
    });
  });
});
