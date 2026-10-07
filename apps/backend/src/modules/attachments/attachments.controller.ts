import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IsBoolean } from 'class-validator';
import type { Response } from 'express';

import { CurrentUser } from '../auth/current-user.decorator.js';
import type { User } from '../users/user.entity.js';
import { AttachmentTarget } from './attachment.entity.js';
import { AttachmentsService, type FileQuery } from './attachments.service.js';

class ShareDto {
  @IsBoolean() sharedWithClient: boolean;
}

@Controller()
export class AttachmentsController {
  constructor(private readonly attachments: AttachmentsService) {}

  // Thư viện tệp và bản vẽ
  @Get('files')
  library(@Query() query: FileQuery) {
    return this.attachments.library(query);
  }

  // Khai báo trước route /:targetType/:targetId để không bị nuốt mất
  @Get('attachments/:id/versions')
  versions(@Param('id', ParseUUIDPipe) id: string) {
    return this.attachments.versions(id);
  }

  @Post('attachments/:id/versions')
  @UseInterceptors(FileInterceptor('file'))
  uploadVersion(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.attachments.uploadVersion(user, id, file);
  }

  @Get('attachments/:targetType/:targetId')
  list(
    @Param('targetType', new ParseEnumPipe(AttachmentTarget))
    targetType: AttachmentTarget,
    @Param('targetId', ParseUUIDPipe) targetId: string,
  ) {
    return this.attachments.list(targetType, targetId);
  }

  @Post('attachments/:targetType/:targetId')
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @CurrentUser() user: User,
    @Param('targetType', new ParseEnumPipe(AttachmentTarget))
    targetType: AttachmentTarget,
    @Param('targetId', ParseUUIDPipe) targetId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('shared') shared?: string,
  ) {
    return this.attachments.upload(
      user,
      targetType,
      targetId,
      file,
      shared === 'true',
    );
  }

  @Patch('attachments/:id')
  share(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ShareDto,
  ) {
    return this.attachments.setShared(user, id, dto.sharedWithClient);
  }

  @Get('attachments/:id')
  async download(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('download') download: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { attachment, stream } = await this.attachments.open(id);
    res.set({
      'Content-Type': attachment.mimeType,
      'Content-Length': String(attachment.size),
      'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename*=UTF-8''${encodeURIComponent(attachment.fileName)}`,
    });
    return new StreamableFile(stream);
  }

  @Delete('attachments/:id')
  @HttpCode(204)
  remove(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.attachments.remove(user, id);
  }
}
