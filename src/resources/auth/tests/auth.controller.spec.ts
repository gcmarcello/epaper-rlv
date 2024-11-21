import { Test, TestingModule } from "@nestjs/testing";
import { AuthController } from "../auth.controller";
import { AuthService } from "../auth.service";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { LoginDto } from "../dto/login.dto";
import { User } from "@/resources/users/entities/user.entity";
import { TsRestException } from "@ts-rest/nest";
import { authContract } from "@/resources/auth/auth.contract";
import { AuthenticatedRequest } from "@/types/authenticatedRequest";

export const userMock = {
  id: "uuid",
  created_at: new Date(),
  updated_at: new Date(),
  email: "email@email.com",
  name: "name",
} as User;

export const AuthServiceMock = {
  provide: AuthService,
  useValue: {
    login: jest.fn(),
    updateActiveOrganization: jest.fn(),
  },
};

export const ConfigServiceMock = {
  provide: ConfigService,
  useValue: {
    get: jest.fn().mockReturnValue("secret"),
  },
};

export const JwtServiceMock = {
  provide: JwtService,
  useValue: {
    sign: jest.fn().mockReturnValue("token"),
  },
};

describe("AuthController", () => {
  let authController: AuthController;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [AuthServiceMock, ConfigServiceMock, JwtServiceMock],
    }).compile();

    authController = moduleFixture.get<AuthController>(AuthController);
  });

  it("should be defined", () => {
    expect(authController).toBeDefined();
  });

  describe("login", () => {
    it("should return a token", async () => {
      const loginDto: LoginDto = { email: "email", password: "password" };
      const tokenResponse = { token: "token" };

      const handler = authController["login"]();

      jest.spyOn(AuthServiceMock.useValue, "login").mockResolvedValue(tokenResponse);

      const result = await handler({
        body: loginDto,
        headers: {
          "content-type": "application/json",
        },
      });

      expect(result).toEqual({
        status: 200,
        body: tokenResponse,
      });
    });
    it("should return a 401 error", async () => {
      const loginDto: LoginDto = { email: "email", password: "password" };

      const exception = new TsRestException(authContract.login, {
        status: 401,
        body: { message: "Senha ou usuário incorretos." },
      });

      jest.spyOn(AuthServiceMock.useValue, "login").mockRejectedValue(exception);

      const handler = authController["login"]();

      await expect(
        handler({
          body: loginDto,
          headers: {
            "content-type": "application/json",
          },
        })
      ).rejects.toThrow(exception);
    });
  });

  describe("updateActiveOrganization", () => {
    it("should return a token", async () => {
      const tokenResponse = { token: "token" };

      const mockedRequest = {
        user: {
          id: "uuid",
          name: "name",
          organizationId: "uuid",
        },
      } as AuthenticatedRequest;

      const handler = authController["updateActiveOrganization"](mockedRequest);

      jest
        .spyOn(AuthServiceMock.useValue, "updateActiveOrganization")
        .mockResolvedValue(tokenResponse);

      const result = await handler({
        headers: {
          "content-type": "application/json",
        },
        body: {
          organizationId: "uuid",
        },
      });

      expect(result).toEqual({
        status: 200,
        body: tokenResponse,
      });
    });
    it("should throw a 403", async () => {
      const mockedRequest = {
        user: {
          id: "uuid",
          name: "name",
          organizationId: "uuid",
        },
      } as AuthenticatedRequest;

      const exception = new TsRestException(authContract.updateActiveOrganization, {
        status: 403,
        body: { message: "Usuário não é membro da organização." },
      });

      const handler = authController["updateActiveOrganization"](mockedRequest);

      jest.spyOn(AuthServiceMock.useValue, "updateActiveOrganization").mockRejectedValue(exception);

      await expect(
        handler({
          headers: {
            "content-type": "application/json",
          },
          body: {
            organizationId: "uuid",
          },
        })
      ).rejects.toThrow(exception);
    });
  });
});
