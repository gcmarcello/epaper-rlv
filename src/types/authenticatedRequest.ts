import { Request } from "express";

export type UserPayload = {
  id: string;
  name: string;
  organizationId?: string;
  iat?: number;
  exp?: number;
};

export type AuthenticatedRequest = Request & {
  user: UserPayload;
};
