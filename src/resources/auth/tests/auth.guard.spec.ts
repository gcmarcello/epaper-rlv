import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Test, TestingModule } from "@nestjs/testing";
import { AuthGuard } from "../auth.guard";
import { UserPayload } from "@/types/authenticatedRequest";

describe("AuthGuard", () => {
  let authGuard: AuthGuard;
  let jwtService: JwtService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        {
          provide: JwtService,
          useValue: {
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    authGuard = module.get<AuthGuard>(AuthGuard);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it("should be defined", () => {
    expect(authGuard).toBeDefined();
  });

  it("should throw UnauthorizedException if no token is provided", async () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {},
        }),
      }),
    } as ExecutionContext;

    await expect(authGuard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it("should throw UnauthorizedException if token verification fails", async () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            authorization: "invalid-token",
          },
        }),
      }),
    } as ExecutionContext;

    jest.spyOn(configService, "get").mockReturnValue("test-secret");
    jest.spyOn(jwtService, "verifyAsync").mockRejectedValue(new Error("Invalid token"));

    await expect(authGuard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it("should set user in request if token is valid", async () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            authorization: "valid-token",
          },
        }),
      }),
    } as ExecutionContext;

    const mockPayload: UserPayload = {
      id: crypto.randomUUID(),
      name: "Test User",
      organizationId: crypto.randomUUID(),
    };
    jest.spyOn(configService, "get").mockReturnValue("test-secret");
    jest.spyOn(jwtService, "verifyAsync").mockResolvedValue(mockPayload);

    const result = await authGuard.canActivate(context);
    const request = context.switchToHttp().getRequest();

    expect(result).toBe(true);
    expect(request.user).toEqual(mockPayload);
  });
});
