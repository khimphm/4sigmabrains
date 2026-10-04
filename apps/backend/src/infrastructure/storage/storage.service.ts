import { randomUUID } from 'node:crypto';
import type { Readable } from 'node:stream';

import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { AppConfig } from '../../config/configuration.js';

// Lưu file (bản vẽ, tài liệu đính kèm) trên dịch vụ tương thích S3.
// File luôn đi qua backend nên trình duyệt không cần truy cập trực tiếp kho lưu trữ.
@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client;
  readonly bucket: string;

  constructor(config: ConfigService<AppConfig, true>) {
    const {
      bucket,
      endpoint,
      region,
      accessKeyId,
      secretAccessKey,
      forcePathStyle,
    } = config.get('storage', {
      infer: true,
    });
    this.client = new S3Client({
      endpoint,
      region,
      forcePathStyle,
      credentials: { accessKeyId, secretAccessKey },
    });
    this.bucket = bucket;
  }

  async onModuleInit() {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch (e) {
      const status = (e as { $metadata?: { httpStatusCode?: number } })
        .$metadata?.httpStatusCode;
      if (status === 404) {
        await this.client
          .send(new CreateBucketCommand({ Bucket: this.bucket }))
          .catch((err) => {
            this.logger.error(
              `Không tạo được bucket ${this.bucket}: ${String(err)}`,
            );
          });
        this.logger.log(`Đã tạo bucket ${this.bucket}`);
      } else {
        // Không chặn khởi động khi kho file chưa sẵn sàng; chỉ tính năng file bị ảnh hưởng.
        this.logger.error(`Không kết nối được kho lưu file: ${String(e)}`);
      }
    }
  }

  async upload(prefix: string, body: Buffer, contentType: string) {
    const key = `${prefix}/${randomUUID()}`;
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
    return key;
  }

  async download(key: string) {
    const res = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    return res.Body as Readable;
  }

  async remove(key: string) {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }
}
