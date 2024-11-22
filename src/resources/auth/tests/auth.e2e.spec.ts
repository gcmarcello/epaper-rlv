import { Test } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../../../app.module";
import { DrizzleAsyncProvider } from "../../../common/db/db.provider";
import * as schema from "../../../common/db/db.schema";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { hash } from "@/utils/bcrypt";

describe("Auth (e2e)", () => {
  let app: INestApplication;
  let db: NodePgDatabase<typeof schema>;
  let testUser: any;
  let testOrg: any;

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

    testOrg = await db
      .insert(schema.organizations)
      .values({
        name: "Test Org",
        owner_id: testUser[0].id,
      })
      .returning();

    await db.insert(schema.userOrganizations).values({
      user_id: testUser[0].id,
      organization_id: testOrg[0].id,
    });
  });

  afterAll(async () => {
    await db.delete(schema.files);
    await db.delete(schema.userOrganizations);
    await db.delete(schema.organizations);
    await db.delete(schema.users);

    await app.close();
  });

  describe("POST /auth/login", () => {
    it("should login successfully with correct credentials", () => {
      return request(app.getHttpServer())
        .post("/auth/login")
        .send({
          email: "test@example.com",
          password: "test123",
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.token).toBeDefined();
        });
    });

    it("should fail with incorrect password", () => {
      return request(app.getHttpServer())
        .post("/auth/login")
        .send({
          email: "test@example.com",
          password: "wrongpassword",
        })
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toBe("Senha ou usuário incorretos.");
        });
    });

    it("should fail with non-existent email", () => {
      return request(app.getHttpServer())
        .post("/auth/login")
        .send({
          email: "nonexistent@example.com",
          password: "test123",
        })
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toBe("Senha ou usuário incorretos.");
        });
    });
  });

  describe("POST /auth/organization", () => {
    let authToken: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer()).post("/auth/login").send({
        email: "test@example.com",
        password: "test123",
      });
      authToken = response.body.token;
    });

    it("should update active organization successfully", () => {
      return request(app.getHttpServer())
        .post("/auth/organization")
        .set("Authorization", `${authToken}`)
        .send({
          organizationId: testOrg[0].id,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.token).toBeDefined();
        });
    });

    it("should fail when trying to update to non-member organization", async () => {
      const nonMemberOrg = await db
        .insert(schema.organizations)
        .values({
          name: "Non Member Org",
          owner_id: testUser[0].id,
        })
        .returning();

      return request(app.getHttpServer())
        .post("/auth/organization")
        .set("Authorization", `${authToken}`)
        .send({
          organizationId: nonMemberOrg[0].id,
        })
        .expect(403)
        .expect((res) => {
          expect(res.body.message).toBe("Usuário não é membro da organização.");
        });
    });

    it("should fail without authentication", () => {
      return request(app.getHttpServer())
        .post("/auth/organization")
        .send({
          organizationId: testOrg[0].id,
        })
        .expect(401);
    });
  });
});
