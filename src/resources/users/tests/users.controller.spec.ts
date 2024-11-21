import { Test, TestingModule } from "@nestjs/testing";
import { UsersController } from "../users.controller";
import { UsersService } from "../users.service";
import { ConfigModule } from "@nestjs/config";
import { DBModule } from "@/common/db/db.module";
import { JwtService } from "@nestjs/jwt";
import { AuthGuard } from "../../auth/auth.guard";
import { User } from "../entities/user.entity";
import { TsRestException } from "@ts-rest/nest";
import { userContract } from "../users.contract";

describe("UsersController", () => {
  let controller: UsersController;
  let usersService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DBModule, ConfigModule],
      controllers: [UsersController],
      providers: [
        UsersService,
        JwtService,
        {
          provide: AuthGuard,
          useValue: {
            canActivate: jest.fn(() => true),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("create", () => {
    it("should create a user and return status 200", async () => {
      const body = { name: "John Doe", email: "email@email.com", password: "password" };
      const id = crypto.randomUUID();

      jest.spyOn(usersService, "create").mockResolvedValue({
        user: { id, name: body.name },
      });

      const result = await controller.create()({ body, headers: {} });

      expect(result).toEqual({ status: 200, body: { user: { name: body.name, id } } });
    });

    it("should return status 409 if user creation fails", async () => {
      const body = { name: "John Doe", email: "email@email.com", password: "password" };

      jest.spyOn(usersService, "create").mockRejectedValue(
        new TsRestException(userContract.createUser, {
          status: 409,
          body: { message: "Email already exists" },
        })
      );

      await expect(controller.create()({ body, headers: {} })).rejects.toThrow(
        new TsRestException(userContract.createUser, {
          status: 409,
          body: { message: "Email already exists" },
        })
      );
    });
  });

  describe("findAll", () => {
    it("should return all users with status 200", async () => {
      const query = { limit: 10, offset: 0 };
      const users: User[] = [
        {
          id: crypto.randomUUID(),
          name: "John Doe",
          created_at: new Date(),
          updated_at: new Date(),
          email: "email@email.com",
          password: "password",
        },
      ];
      const total = users.length;
      jest.spyOn(usersService, "findAll").mockResolvedValue({ users, total });

      const result = await controller.findAll()({ query, headers: {} });

      expect(result).toEqual({ status: 200, body: { users, total } });
    });
  });

  describe("findbyId", () => {
    it("should return a user by id with status 200", async () => {
      const id = crypto.randomUUID();
      const params = { id };
      const user = {
        id,
        name: "John Doe",
        created_at: new Date(),
        updated_at: new Date(),
        email: "email@email.com",
        password: "password",
      };
      jest.spyOn(usersService, "findbyId").mockResolvedValue(user);

      const result = await controller.findbyId()({ params, headers: {} });

      expect(result).toEqual({ status: 200, body: user });
    });
  });
});
