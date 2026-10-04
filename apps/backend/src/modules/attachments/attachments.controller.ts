import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  Post,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';

import { CurrentUser } from '../auth/current-user.decorator.js';
import type { User } from '../users/user.entity.js';
import { AttachmentTarget } from './attachment.entity.js';
import { AttachmentsService } from './attachments.service.js';

@Controller('attachments')
export class AttachmentsController {
  constructor(private readonly attachments: AttachmentsService) {}

  @Get(':targetType/:targetId')
  list(
    @Param('targetType', new ParseEnumPipe(AttachmentTarget))
    targetType: AttachmentTarget,
    @Param('targetId', ParseUUIDPipe) targetId: string,
  ) {
    return this.attachments.list(targetType, targetId);
  }

  @Post(':targetType/:targetId')
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @CurrentUser() user: User,
    @Param('targetType', new ParseEnumPipe(AttachmentTarget))
    targetType: AttachmentTarget,
    @Param('targetId', ParseUUIDPipe) targetId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.attachments.upload(user, targetType, targetId, file);
  }

  @Get(':id')
  async download(
    @Param('id', ParseUUIDPipe) id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { attachment, stream } = await this.attachments.open(id);
    res.set({
      'Content-Type': attachment.mimeType,
      'Content-Length': String(attachment.size),
      'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(attachment.fileName)}`,
    });
    return new StreamableFile(stream);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.attachments.remove(user, id);
  }
}
