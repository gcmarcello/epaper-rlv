import { UsersService } from "../users.service";
import { CreateUserDto } from "../dto/create-user.dto";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "../../../common/db/db.schema";
import { hash } from "@/utils/bcrypt";
import { TsRestException } from "@ts-rest/nest";
import crypto from "crypto";

jest.mock("@/utils/bcrypt", () => ({
  hash: jest.fn(),
}));

describe("UsersService", () => {
  let service: UsersService;
  let db: NodePgDatabase<typeof schema>;

  beforeEach(async () => {
    db = {
      query: {
        users: {
          findFirst: jest.fn(),
          findMany: jest.fn(),
        },
      },
      insert: jest.fn(),
    } as any;

    service = new UsersService(db);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create a new user", async () => {
      const createUserDto: CreateUserDto = {
        email: "test@example.com",
        password: "password",
        name: "Test User",
      };

      jest
        .spyOn(service, "create")
        .mockResolvedValueOnce({ user: { name: createUserDto.name, id: "uuid" } });
      (hash as jest.Mock).mockResolvedValue("hashedpassword");

      const data = { ...createUserDto, password: await hash("password") };

      const result = await service.create(data);
      expect(result).toEqual({ user: { name: createUserDto.name, id: "uuid" } });
    });
    it("should throw an error if email already exists", async () => {
      const createUserDto: CreateUserDto = {
        email: "test@example.com",
        password: "password",
        name: "Test User",
      };

      (db.query.users.findFirst as jest.Mock).mockResolvedValueOnce({ email: createUserDto.email });

      await expect(service.create(createUserDto)).rejects.toThrow(
        new TsRestException(expect.anything(), {
          status: 409,
          body: { message: "Email already exists" },
        })
      );
    });
  });

  describe("findAll", () => {
    it("should return all users", async () => {
      const users = [
        {
          email: "test1@example.com",
          id: "1",
          name: "Test User 1",
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          email: "test2@example.com",
          id: "2",
          name: "Test User 2",
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      (db.query.users.findMany as jest.Mock).mockResolvedValueOnce(users);

      const result = await service.findAll();
      expect(result).toEqual({ users, total: users.length });
    });

    it("should throw an error if no users found", async () => {
      (db.query.users.findMany as jest.Mock).mockResolvedValueOnce([]);

      await expect(service.findAll()).rejects.toThrow(
        new TsRestException(expect.anything(), {
          status: 404,
          body: { message: "No Users Found" },
        })
      );
    });
  });

  describe("findbyId", () => {
    it("should return a user by id", async () => {
      const userId = crypto.randomUUID();
      const user = {
        email: "test@example.com",
        id: userId,
        name: "Test User",
        created_at: new Date(),
        updated_at: new Date(),
      };

      (db.query.users.findFirst as jest.Mock).mockResolvedValueOnce(user);

      const result = await service.findbyId(userId);
      expect(result).toEqual(user);
    });

    it("should throw an error if user not found", async () => {
      (db.query.users.findFirst as jest.Mock).mockResolvedValueOnce(null);

      await expect(service.findbyId(crypto.randomUUID())).rejects.toThrow(
        new TsRestException(expect.anything(), {
          status: 404,
          body: { message: "No User Found" },
        })
      );
    });
  });
});
