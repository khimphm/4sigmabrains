import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';

import type { AppConfig } from '../config/configuration.js';

// Lưu file (bản vẽ, tài liệu đính kèm) trên MinIO, tương thích S3.
@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  readonly client: Client;
  readonly bucket: string;

  constructor(config: ConfigService<AppConfig, true>) {
    const { bucket, ...options } = config.get('minio', { infer: true });
    this.client = new Client(options);
    this.bucket = bucket;
  }

  async onModuleInit() {
    try {
      if (!(await this.client.bucketExists(this.bucket))) {
        await this.client.makeBucket(this.bucket);
        this.logger.log(`Đã tạo bucket ${this.bucket}`);
      }
    } catch (e) {
      // Không chặn khởi động API khi MinIO chưa sẵn sàng; tính năng file sẽ lỗi cho tới khi kết nối được.
      this.logger.error(`Không kết nối được MinIO: ${String(e)}`);
    }
  }

  presignedGetUrl(objectKey: string, expirySeconds = 3600) {
    return this.client.presignedGetObject(
      this.bucket,
      objectKey,
      expirySeconds,
    );
  }

  presignedPutUrl(objectKey: string, expirySeconds = 3600) {
    return this.client.presignedPutObject(
      this.bucket,
      objectKey,
      expirySeconds,
    );
  }
}
