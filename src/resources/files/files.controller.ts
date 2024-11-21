import { Controller, UseInterceptors, UploadedFile, Req, UseGuards } from "@nestjs/common";
import { FilesService } from "./files.service";
import { FileInterceptor } from "@nestjs/platform-express";
import { AuthenticatedRequest } from "@/types/authenticatedRequest";
import { TsRestHandler, tsRestHandler } from "@ts-rest/nest";
import { fileContract as c } from "./files.contract";
import { AuthGuard } from "../auth/auth.guard";

@Controller()
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @UseGuards(AuthGuard)
  @TsRestHandler(c.createFile)
  @UseInterceptors(FileInterceptor("file"))
  create(@Req() request: AuthenticatedRequest, @UploadedFile() file: Express.Multer.File) {
    return tsRestHandler(c.createFile, async ({ body }) => {
      const upload = await this.filesService.create(file, { ...body, user_id: request.user.id });
      return { status: 200, body: { message: upload } };
    });
  }

  @UseGuards(AuthGuard)
  @TsRestHandler(c.getFile)
  @UseInterceptors(FileInterceptor("file"))
  getFile(@Req() request: AuthenticatedRequest) {
    return tsRestHandler(c.getFile, async ({ params }) => {
      const url = await this.filesService.findById(params.id, request.user.organizationId);
      return { status: 200, body: { url } };
    });
  }
}
