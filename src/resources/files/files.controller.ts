import {
  Controller,
  UseInterceptors,
  UploadedFile,
  Req,
  UseGuards,
  ParseFilePipeBuilder,
} from "@nestjs/common";
import { FilesService } from "./files.service";
import { FileInterceptor } from "@nestjs/platform-express";
import { AuthenticatedRequest } from "@/types/authenticatedRequest";
import { TsRestException, TsRestHandler, tsRestHandler } from "@ts-rest/nest";
import { fileContract as c, fileContract } from "./files.contract";
import { AuthGuard } from "../auth/auth.guard";

@Controller()
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @UseGuards(AuthGuard)
  @TsRestHandler(c.createFile)
  @UseInterceptors(FileInterceptor("file"))
  create(
    @Req() request: AuthenticatedRequest,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({
          maxSize: 1000000,
        })
        .build()
    )
    file: Express.Multer.File
  ) {
    return tsRestHandler(c.createFile, async ({ body }) => {
      if (!request.user.organizationId || !request.user.id) {
        throw new TsRestException(fileContract.getFile, {
          status: 401,
          body: { message: "Forbidden" },
        });
      }
      const upload = await this.filesService.create(file, {
        ...body,
        user_id: request.user.id,
        organization_id: request.user.organizationId,
      });
      return { status: 200, body: { message: upload } };
    });
  }

  @UseGuards(AuthGuard)
  @TsRestHandler(c.deleteFile)
  deleteFile(@Req() request: AuthenticatedRequest) {
    return tsRestHandler(c.deleteFile, async ({ params }) => {
      if (!request.user.organizationId) {
        throw new TsRestException(fileContract.deleteFile, {
          status: 401,
          body: { message: "Forbidden" },
        });
      }
      await this.filesService.delete(params.id, request.user.id, request.user.organizationId);
      return { status: 200, body: { message: "Arquivo Deletado" } };
    });
  }

  @UseGuards(AuthGuard)
  @TsRestHandler(c.getFile)
  @UseInterceptors(FileInterceptor("file"))
  getFile(@Req() request: AuthenticatedRequest) {
    return tsRestHandler(c.getFile, async ({ params }) => {
      if (!request.user.organizationId) {
        throw new TsRestException(fileContract.deleteFile, {
          status: 403,
          body: { message: "Forbidden" },
        });
      }
      const url = await this.filesService.findById(params.id, request.user.organizationId);
      return { status: 200, body: { url } };
    });
  }

  @UseGuards(AuthGuard)
  @TsRestHandler(c.getFiles)
  getFiles(@Req() request: AuthenticatedRequest) {
    return tsRestHandler(c.getFiles, async ({ query }) => {
      if (!request.user.organizationId) {
        throw new TsRestException(fileContract.deleteFile, {
          status: 401,
          body: { message: "Forbidden" },
        });
      }
      const data = await this.filesService.find(query, request.user.organizationId);
      return { status: 200, body: data };
    });
  }

  @UseGuards(AuthGuard)
  @TsRestHandler(c.updateFile)
  @UseInterceptors(FileInterceptor("file"))
  updateFile(
    @Req() request: AuthenticatedRequest,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({
          maxSize: 1000000,
        })
        .build()
    )
    file: Express.Multer.File
  ) {
    return tsRestHandler(c.updateFile, async ({ body, params }) => {
      if (!request.user.organizationId) {
        throw new TsRestException(fileContract.deleteFile, {
          status: 403,
          body: { message: "Forbidden" },
        });
      }
      await this.filesService.update(params.id, file, {
        ...body,
        organization_id: request.user.organizationId,
        user_id: request.user.id,
      });
      return { status: 200, body: { message: "Arquivo Atualizado" } };
    });
  }
}
