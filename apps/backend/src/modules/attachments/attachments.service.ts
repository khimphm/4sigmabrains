import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { StorageService } from '../../infrastructure/storage/storage.service.js';
import { assertCan, isManager } from '../../common/permissions.js';
import type { User } from '../users/user.entity.js';
import { Attachment, AttachmentTarget } from './attachment.entity.js';

@Injectable()
export class AttachmentsService {
  constructor(
    @InjectRepository(Attachment)
    private readonly attachments: Repository<Attachment>,
    private readonly storage: StorageService,
  ) {}

  list(targetType: AttachmentTarget, targetId: string) {
    return this.attachments.find({
      where: { targetType, targetId },
      order: { createdAt: 'DESC' },
    });
  }

  async upload(
    user: User,
    targetType: AttachmentTarget,
    targetId: string,
    file: Express.Multer.File,
  ) {
    // Tên file tiếng Việt từ multer đến dưới dạng latin1
    const fileName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const objectKey = await this.storage.upload(
      `${targetType.toLowerCase()}/${targetId}`,
      file.buffer,
      file.mimetype,
    );
    const saved = await this.attachments.save(
      this.attachments.create({
        targetType,
        targetId,
        fileName,
        mimeType: file.mimetype,
        size: file.size,
        objectKey,
        uploaderId: user.id,
      }),
    );
    return this.attachments.findOneByOrFail({ id: saved.id });
  }

  async open(id: string) {
    const attachment = await this.attachments.findOne({
      where: { id },
      select: {
        id: true,
        fileName: true,
        mimeType: true,
        size: true,
        objectKey: true,
      },
    });
    if (!attachment) throw new NotFoundException('Không tìm thấy file');
    return {
      attachment,
      stream: await this.storage.download(attachment.objectKey),
    };
  }

  async remove(user: User, id: string) {
    const attachment = await this.attachments.findOne({
      where: { id },
      select: { id: true, uploaderId: true, objectKey: true },
    });
    if (!attachment) throw new NotFoundException('Không tìm thấy file');
    assertCan(attachment.uploaderId === user.id || isManager(user));
    await this.storage.remove(attachment.objectKey);
    await this.attachments.delete(id);
  }
}
