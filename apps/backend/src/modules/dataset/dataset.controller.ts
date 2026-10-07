import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';

import { Roles } from '../../common/decorators.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { User, UserRole } from '../users/user.entity.js';
import {
  AnnotationDto,
  BatchDto,
  LabelTypeDto,
  ReviewDto,
  SubmitDto,
  UpdateAnnotationDto,
  UpdateBatchDto,
  UpdateDrawingDto,
  UpdateLabelTypeDto,
} from './dataset.dto.js';
import { DatasetService } from './dataset.service.js';

@Controller('dataset')
export class DatasetController {
  constructor(private readonly dataset: DatasetService) {}

  @Get('stats')
  stats(@Query('batchId') batchId?: string) {
    return this.dataset.stats(batchId);
  }

  // --- Bộ nhãn lỗi ---
  @Get('labels')
  labels() {
    return this.dataset.listLabels();
  }

  @Post('labels')
  @Roles(UserRole.Admin, UserRole.Manager)
  createLabel(@Body() dto: LabelTypeDto) {
    return this.dataset.createLabel(dto);
  }

  @Patch('labels/:id')
  @Roles(UserRole.Admin, UserRole.Manager)
  updateLabel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLabelTypeDto,
  ) {
    return this.dataset.updateLabel(id, dto);
  }

  @Delete('labels/:id')
  @Roles(UserRole.Admin, UserRole.Manager)
  removeLabel(@Param('id', ParseUUIDPipe) id: string) {
    return this.dataset.removeLabel(id);
  }

  // --- Đợt bản vẽ ---
  @Get('batches')
  batches() {
    return this.dataset.listBatches();
  }

  @Post('batches')
  @Roles(UserRole.Admin, UserRole.Manager)
  createBatch(@CurrentUser() user: User, @Body() dto: BatchDto) {
    return this.dataset.createBatch(user, dto);
  }

  @Get('batches/:id')
  batch(@Param('id', ParseUUIDPipe) id: string) {
    return this.dataset.getBatch(id);
  }

  @Patch('batches/:id')
  @Roles(UserRole.Admin, UserRole.Manager)
  updateBatch(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBatchDto,
  ) {
    return this.dataset.updateBatch(id, dto);
  }

  @Delete('batches/:id')
  @Roles(UserRole.Admin, UserRole.Manager)
  @HttpCode(204)
  removeBatch(@Param('id', ParseUUIDPipe) id: string) {
    return this.dataset.removeBatch(id);
  }

  @Get('batches/:id/drawings')
  drawings(@Param('id', ParseUUIDPipe) id: string) {
    return this.dataset.listDrawings(id);
  }

  @Post('batches/:id/drawings')
  @UseInterceptors(FilesInterceptor('files', 50))
  upload(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.dataset.uploadDrawings(user, id, files);
  }

  // --- Bản vẽ ---
  @Get('drawings/:id')
  drawing(@Param('id', ParseUUIDPipe) id: string) {
    return this.dataset.getDrawing(id);
  }

  @Get('drawings/:id/file')
  async file(
    @Param('id', ParseUUIDPipe) id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { drawing, stream } = await this.dataset.openFile(id);
    res.set({
      'Content-Type': drawing.mimeType,
      'Content-Length': String(drawing.size),
      'Cache-Control': 'private, max-age=3600',
      'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(drawing.fileName)}`,
    });
    return new StreamableFile(stream);
  }

  @Patch('drawings/:id')
  updateDrawing(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDrawingDto,
  ) {
    return this.dataset.updateDrawing(id, dto);
  }

  @Delete('drawings/:id')
  @HttpCode(204)
  removeDrawing(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.dataset.removeDrawing(user, id);
  }

  @Post('drawings/:id/annotations')
  addAnnotation(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AnnotationDto,
  ) {
    return this.dataset.addAnnotation(user, id, dto);
  }

  @Patch('annotations/:id')
  updateAnnotation(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAnnotationDto,
  ) {
    return this.dataset.updateAnnotation(user, id, dto);
  }

  @Delete('annotations/:id')
  @HttpCode(204)
  removeAnnotation(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.dataset.removeAnnotation(user, id);
  }

  @Post('drawings/:id/submit')
  submit(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitDto,
  ) {
    return this.dataset.submit(user, id, dto.reviewerId);
  }

  @Post('drawings/:id/review')
  review(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewDto,
  ) {
    return this.dataset.review(user, id, dto);
  }

  // --- Xuất dữ liệu training ---
  @Get('export')
  async export(
    @Query('format') format: string | undefined,
    @Query('batchId') batchId: string | undefined,
    @Query('all') all: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const fmt = format === 'coco' ? 'coco' : 'jsonl';
    const body = await this.dataset.export(fmt, batchId, all === 'true');
    const stamp = new Date().toISOString().slice(0, 10);
    res.set({
      'Content-Type':
        fmt === 'coco' ? 'application/json' : 'application/x-ndjson',
      'Content-Disposition': `attachment; filename="dataset-${stamp}.${fmt === 'coco' ? 'json' : 'jsonl'}"`,
    });
    return body;
  }
}
