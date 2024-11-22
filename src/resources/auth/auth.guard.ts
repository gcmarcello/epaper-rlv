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

    const token = this.extractTokenFromHeader(request.headers.authorization);

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
    return request.user;
  }

  private extractTokenFromHeader(rawToken: string): string | undefined {
    const [type, token] = rawToken?.split(" ") ?? [];
    return type === "Bearer" ? token : type;
  }
}
