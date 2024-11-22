import { SecurityRequirementObject } from "@nestjs/swagger/dist/interfaces/open-api-spec.interface";

export const hasCustomTags = (metadata: unknown): metadata is { openApiTags: string[] } => {
  return !!metadata && typeof metadata === "object" && "openApiTags" in metadata;
};

export const hasSecurity = (
  metadata: unknown
): metadata is { openApiSecurity: SecurityRequirementObject[] } => {
  return !!metadata && typeof metadata === "object" && "openApiSecurity" in metadata;
};
