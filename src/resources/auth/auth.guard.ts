import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization;

    if (!token) {
      throw new UnauthorizedException();
    }
    const secret = this.configService.get<string>("JWT_SECRET");

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret,
      });

      request["user"] = payload;
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }
}
