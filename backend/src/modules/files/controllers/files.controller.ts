import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { successResponse } from '../../../common/http/api-response';
import type { ApiSuccessResponse } from '../../../common/http/api-response.types';
import { RequirePermissions } from '../../rbac/decorators/require-permissions.decorator';
import { UploadFileDto } from '../dto/upload-file.dto';
import { FileMapper } from '../mappers/file.mapper';
import type { FileRecord } from '../repositories/file.repository.interface';
import type { FileApplicationContext, FileScope } from '../services/file-application.types';
import { FileService } from '../services/file.service';
import type { UploadedFilePayload } from '../types/uploaded-file.types';

const TENANT_HEADER = 'x-tenant-id';
const WORKSPACE_HEADER = 'x-workspace-id';
const USER_HEADER = 'x-user-id';

@Controller('files')
export class FilesController {
  constructor(private readonly fileService: FileService) {}

  @Post('upload')
  @RequirePermissions('files.manage')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @UploadedFile() file: UploadedFilePayload | undefined,
    @Body() dto: UploadFileDto,
  ): Promise<ApiSuccessResponse<FileRecord>> {
    const scope = this.resolveScope(headers);
    const context = this.resolveContext(headers);
    const command = FileMapper.toUploadFileCommand(
      dto,
      file ?? {
        originalname: '',
        mimetype: '',
        buffer: Buffer.alloc(0),
      },
    );
    const record = await this.fileService.uploadFile(scope, command, context);

    return successResponse(record);
  }

  @Get(':id/download')
  @RequirePermissions('files.read')
  async download(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
    @Res() response: Response,
  ): Promise<void> {
    const scope = this.resolveScope(headers);
    const { record, buffer } = await this.fileService.downloadFile(scope, id);

    response.setHeader('Content-Type', record.mimeType);
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(record.originalName)}"`,
    );
    response.send(buffer);
  }

  @Get(':entityType/:entityId')
  @RequirePermissions('files.read')
  async listByEntity(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('entityType') entityType: string,
    @Param('entityId', ParseUUIDPipe) entityId: string,
  ): Promise<ApiSuccessResponse<readonly FileRecord[]>> {
    const scope = this.resolveScope(headers);
    const files = await this.fileService.listFilesByEntity(scope, entityType, entityId);

    return successResponse(files);
  }

  @Delete(':id')
  @RequirePermissions('files.manage')
  async remove(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiSuccessResponse<FileRecord>> {
    const scope = this.resolveScope(headers);
    const file = await this.fileService.deleteFile(scope, id);

    return successResponse(file);
  }

  private resolveScope(headers: Record<string, string | string[] | undefined>): FileScope {
    return {
      tenantId: this.readHeader(headers, TENANT_HEADER),
      workspaceId: this.readHeader(headers, WORKSPACE_HEADER),
    };
  }

  private resolveContext(
    headers: Record<string, string | string[] | undefined>,
  ): FileApplicationContext {
    return {
      actorUserId: this.readHeader(headers, USER_HEADER),
    };
  }

  private readHeader(headers: Record<string, string | string[] | undefined>, name: string): string {
    const value = headers[name];
    return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
  }
}
