import { Test } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../../../app.module";
import { DrizzleAsyncProvider } from "../../../common/db/db.provider";
import * as schema from "../../../common/db/db.schema";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { hash } from "@/utils/bcrypt";

describe("Users (e2e)", () => {
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

    // Get auth token
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

  describe("POST /users", () => {
    it("should create a new user successfully", () => {
      return request(app.getHttpServer())
        .post("/users")
        .send({
          email: "newuser@example.com",
          password: "password123",
          name: "New User",
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.user).toBeDefined();
          expect(res.body.user.name).toBe("New User");
          expect(res.body.user.id).toBeDefined();
        });
    });

    it("should fail when creating user with existing email", () => {
      return request(app.getHttpServer())
        .post("/users")
        .send({
          email: "test@example.com",
          password: "password123",
          name: "Duplicate User",
        })
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toBe("Email already exists");
        });
    });
  });

  describe("GET /users", () => {
    it("should get all users when authenticated", () => {
      return request(app.getHttpServer())
        .get("/users")
        .set("Authorization", `${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.users).toBeDefined();
          expect(Array.isArray(res.body.users)).toBeTruthy();
          expect(res.body.total).toBeDefined();
        });
    });

    it("should fail without authentication", () => {
      return request(app.getHttpServer()).get("/users").expect(401);
    });
  });

  describe("GET /users/:id", () => {
    it("should get user by id when authenticated", () => {
      return request(app.getHttpServer())
        .get(`/users/${testUser[0].id}`)
        .set("Authorization", `${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe("Test User");
          expect(res.body.email).toBe("test@example.com");
          expect(res.body.id).toBe(testUser[0].id);
        });
    });

    it("should fail when user does not exist", () => {
      return request(app.getHttpServer())
        .get("/users/e83192ee-a669-48fd-8cd1-48ac4a524657")
        .set("Authorization", `${authToken}`)
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toBe("No User Found");
        });
    });

    it("should fail invalid id", () => {
      return request(app.getHttpServer())
        .get("/users/nonexistent-id")
        .set("Authorization", `${authToken}`)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toBe(undefined);
        });
    });

    it("should fail without authentication", () => {
      return request(app.getHttpServer()).get(`/users/${testUser[0].id}`).expect(401);
    });
  });
});
