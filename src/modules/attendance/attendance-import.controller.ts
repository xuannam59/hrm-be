import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  MessageEvent,
  Param,
  ParseFilePipeBuilder,
  ParseIntPipe,
  Post,
  Res,
  Sse,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AttendanceImportService } from './attendance-import.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ALLOWED_FILE_EMPLOYEES_IMPORT } from '@/common/constants/file.constant';
import { type Request, type Response } from 'express';
import { Observable } from 'rxjs';
import { AttendanceImportProgressService } from './attendance-import-progress.service';
import { Roles } from '@/common/decorators/roles.decorator';
import { ERole } from '@/common/constants/user.constant';

@Controller('attendance')
export class AttendanceImportController {
  constructor(
    private readonly attendanceImportService: AttendanceImportService,
    private readonly attendanceImportProgressService: AttendanceImportProgressService,
  ) {}

  @Post('import')
  @HttpCode(HttpStatus.ACCEPTED)
  @Roles(ERole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async importAttendance(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: ALLOWED_FILE_EMPLOYEES_IMPORT,
          fallbackToMimetype: true,
          errorMessage: 'File must be a CSV or XLSX file',
        })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    file: Express.Multer.File,
  ) {
    return this.attendanceImportService.importAttendance(file);
  }

  @Get('import-jobs')
  @Roles(ERole.ADMIN)
  getImportJobs() {
    return this.attendanceImportService.getImportJobs();
  }

  @Post('retry-import/:logId')
  @HttpCode(HttpStatus.ACCEPTED)
  @Roles(ERole.ADMIN)
  retryImport(@Param('logId', ParseIntPipe) logId: number) {
    return this.attendanceImportService.retryImport(logId);
  }

  @Sse('progress/:jobId')
  @Roles(ERole.ADMIN)
  streamProgress(
    @Param('jobId', ParseIntPipe) jobId: number,
  ): Observable<MessageEvent> {
    const behaviorSubject =
      this.attendanceImportProgressService.getOrCreate(jobId);
    return behaviorSubject.asObservable();
  }
}
