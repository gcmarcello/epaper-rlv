import { Request } from "express";

export type AuthenticatedRequest = Request & {
  user: { id: string; name: string; iat: number; exp: number };
};
