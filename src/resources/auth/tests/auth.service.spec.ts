import { AuthService } from "../auth.service";
import { JwtService } from "@nestjs/jwt";
import { LoginDto } from "../dto/login.dto";
import { TsRestException } from "@ts-rest/nest";
import { organizationContract } from "@/resources/organizations/organizations.contract";
import { compare } from "@/utils/bcrypt";
import { UserPayload } from "@/types/authenticatedRequest";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "../../../common/db/db.schema";

jest.mock("@/utils/bcrypt", () => ({
  compare: jest.fn(),
}));

describe("AuthService", () => {
  let service: AuthService;
  let jwtService: JwtService;
  let db: NodePgDatabase<typeof schema>;

  beforeEach(async () => {
    db = {
      query: {
        users: { findFirst: jest.fn() },
        userOrganizations: { findFirst: jest.fn() },
      },
    } as any;
    jwtService = new JwtService();
    service = new AuthService(db, jwtService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("login", () => {
    it("should throw an error if user is not found", async () => {
      (db.query.users.findFirst as jest.Mock).mockResolvedValue(null);

      const loginDto: LoginDto = { email: "test@example.com", password: "password" };

      await expect(service.login(loginDto)).rejects.toThrow(
        new TsRestException(organizationContract.findOrgs, {
          status: 404,
          body: { message: "Senha ou usuário incorretos." },
        })
      );
    });

    it("should throw an error if password does not match", async () => {
      (db.query.users.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
        email: "test@example.com",
        password: "hashedpassword",
      });

      (compare as jest.Mock).mockResolvedValue(false);

      const loginDto: LoginDto = { email: "test@example.com", password: "password" };

      await expect(service.login(loginDto)).rejects.toThrow(
        new TsRestException(organizationContract.findOrgs, {
          status: 404,
          body: { message: "Senha ou usuário incorretos." },
        })
      );
    });

    it("should return a token if login is successful", async () => {
      (db.query.users.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
        email: "test@example.com",
        password: "hashedpassword",
      });

      (compare as jest.Mock).mockResolvedValue(true);
      jest.spyOn(jwtService, "signAsync").mockResolvedValue("token");

      const loginDto: LoginDto = { email: "test@example.com", password: "password" };

      const result = await service.login(loginDto);

      expect(result).toEqual({ token: "token" });
    });
  });

  describe("updateActiveOrganization", () => {
    it("should throw an error if user is not a member of the organization", async () => {
      (db.query.userOrganizations.findFirst as jest.Mock).mockResolvedValue(null);

      const payload: UserPayload = { id: "uuid", name: "Test User" };
      const organizationId = "org1";

      await expect(service.updateActiveOrganization(payload, organizationId)).rejects.toThrow(
        new TsRestException(organizationContract.findOrgs, {
          status: 403,
          body: { message: "Usuário não é membro da organização." },
        })
      );
    });

    it("should return a token if user is a member of the organization", async () => {
      (db.query.userOrganizations.findFirst as jest.Mock).mockResolvedValue({
        user_id: 1,
        organization_id: "org1",
      });

      jest.spyOn(jwtService, "signAsync").mockResolvedValue("token");

      const payload: UserPayload = { id: "uuid", name: "Test User" };
      const organizationId = "org1";

      const result = await service.updateActiveOrganization(payload, organizationId);

      expect(result).toEqual({ token: "token" });
    });
  });
});
