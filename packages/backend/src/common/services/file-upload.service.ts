import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import * as crypto from 'crypto';

export interface UploadResult {
  fileName: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
  url: string;
}

@Injectable()
export class FileUploadService {
  private s3Client: S3Client;
  private bucket: string;

  constructor(private configService: ConfigService) {
    this.bucket = this.configService.get<string>('storage.bucket') || 'sdlc-uploads';
    this.s3Client = new S3Client({
      endpoint: this.configService.get<string>('storage.endpoint') || 'http://localhost:9000',
      credentials: {
        accessKeyId: this.configService.get<string>('storage.accessKey') || 'minioadmin',
        secretAccessKey: this.configService.get<string>('storage.secretKey') || 'minio_secret',
      },
      forcePathStyle: true,
      region: 'us-east-1',
    });
  }

  async uploadFile(file: Express.Multer.File, prefix: string = 'general'): Promise<UploadResult> {
    const fileExtension = file.originalname.split('.').pop() || '';
    const uniqueName = `${crypto.randomBytes(8).toString('hex')}.${fileExtension}`;
    const key = `${prefix}/${uniqueName}`;

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ContentLength: file.size,
      }),
    );

    const endpoint = this.configService.get<string>('storage.endpoint') || 'localhost:9000';
    const useSsl = this.configService.get<string>('storage.useSsl') === 'true';
    const protocol = useSsl ? 'https' : 'http';

    return {
      fileName: file.originalname,
      filePath: key,
      mimeType: file.mimetype,
      fileSize: file.size,
      url: `${protocol}://${endpoint}/${this.bucket}/${key}`,
    };
  }

  async deleteFile(filePath: string): Promise<void> {
    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: filePath,
      }),
    );
  }

  async getPublicUrl(filePath: string): Promise<string> {
    const endpoint = this.configService.get<string>('storage.endpoint') || 'localhost:9000';
    const useSsl = this.configService.get<string>('storage.useSsl') === 'true';
    const protocol = useSsl ? 'https' : 'http';
    return `${protocol}://${endpoint}/${this.bucket}/${filePath}`;
  }
}
