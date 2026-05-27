import {
  Controller,
  Post,
  Param,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { FileUploadService } from './file-upload.service';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class FileUploadController {
  constructor(private fileUploadService: FileUploadService) {}

  @Post('issues/:issueId')
  @UseInterceptors(FileInterceptor('file'))
  async uploadIssueAttachment(
    @Param('issueId') issueId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    return this.fileUploadService.uploadFile(file, `issues/${issueId}`);
  }

  @Post('bugs/:bugId')
  @UseInterceptors(FileInterceptor('file'))
  async uploadBugAttachment(
    @Param('bugId') bugId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    return this.fileUploadService.uploadFile(file, `bugs/${bugId}`);
  }

  @Post('general')
  @UseInterceptors(FileInterceptor('file'))
  async uploadGeneral(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    return this.fileUploadService.uploadFile(file, 'general');
  }
}
