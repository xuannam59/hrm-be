import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { readExcelFile, sleep } from '@/common/utils/file.util';
import { validateEmployeeImportHeaders } from '@/common/utils/employee.util';
import {
  ATTENDANCE_IMPORT_COLUMNS,
  EAttendanceImportLogStatus,
  EAttendanceImportStatus,
  EAttendanceRecordType,
  EAttendanceStatus,
} from '@/common/constants/attendance.constant';
import * as crypto from 'crypto';
import { CHUNK_SIZE } from '@/common/constants/common.constant';
import {
  AttendanceImportError,
  AttendanceImportRow,
} from '@/common/types/attendance.type';
import { calculateWorkHours, formatDate } from '@/common/utils/date.util';
import { DataSource, Not, Repository } from 'typeorm';
import { AttendanceEntity } from './entities/attendance.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { AttendanceImportJobsEntity } from './entities/attendance-import-jobs.entity';
import { AttendanceImportLogsEntity } from './entities/attendance-import-logs.entity';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { AttendanceImportProgressService } from './attendance-import-progress.service';

@Injectable()
export class AttendanceImportService {
  constructor(
    @InjectRepository(AttendanceEntity)
    private readonly attendanceRepository: Repository<AttendanceEntity>,
    @InjectRepository(AttendanceImportJobsEntity)
    private readonly attendanceImportJobsRepository: Repository<AttendanceImportJobsEntity>,
    @InjectRepository(AttendanceImportLogsEntity)
    private readonly attendanceImportLogsRepository: Repository<AttendanceImportLogsEntity>,
    private readonly cloudinaryService: CloudinaryService,
    private readonly attendanceImportProgressService: AttendanceImportProgressService,
    private readonly dataSource: DataSource,
  ) {}

  private readonly logger = new Logger(AttendanceImportService.name);

  async importAttendance(file: Express.Multer.File) {
    // eslint-disable-next-line no-useless-catch
    try {
      const { headers, csvData } = readExcelFile(file.buffer);

      if (
        !headers ||
        !validateEmployeeImportHeaders(
          headers,
          ATTENDANCE_IMPORT_COLUMNS.COLUMNS,
        )
      ) {
        throw new BadRequestException('Headers is not valid format');
      }

      const rows = this.convertAttendanceDataToObject(csvData);

      const errorsMessages = this.handleImportAttendance(rows);

      if (errorsMessages.length > 0) {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Errors in attendance import',
            data: errorsMessages,
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const fileHash = crypto
        .createHash('sha256')
        .update(file.buffer)
        .digest('hex');

      const totalRows = rows.length;
      const totalBatches = Math.ceil(totalRows / CHUNK_SIZE) || 0;
      const uploadedFile = await this.cloudinaryService.uploadFile(file);

      const existJob = await this.attendanceImportJobsRepository.findOne({
        where: {
          fileHash,
        },
      });

      let jobId: number;

      if (!existJob) {
        const attendanceImportJob = this.attendanceImportJobsRepository.create({
          fileName: file.originalname,
          fileHash,
          filePath: uploadedFile.secure_url,
          totalRows,
          totalBatches,
        });

        await this.attendanceImportJobsRepository.save(attendanceImportJob);
        jobId = attendanceImportJob.id;
      } else {
        if (existJob.status === EAttendanceImportStatus.COMPLETED) {
          throw new BadRequestException(
            'File is already imported and completed',
          );
        }
        await this.attendanceImportJobsRepository.update(existJob.id, {
          status: EAttendanceImportStatus.PENDING,
        });
        jobId = existJob.id;
      }

      void this.handleImportAttendanceBatch(rows, jobId);

      return {
        message: 'Attendance import job created successfully',
        jobId,
      };
    } catch (error: any) {
      throw error;
    }
  }

  async getImportJobs() {
    const importJobs = await this.attendanceImportJobsRepository.find({
      relations: {
        logs: true,
      },
      order: {
        updatedAt: 'DESC',
      },
    });
    return importJobs;
  }

  async retryImport(logId: number) {
    const log = await this.attendanceImportLogsRepository.findOne({
      where: { id: logId, status: EAttendanceImportLogStatus.FAILED },
      relations: {
        job: true,
      },
      select: {
        id: true,
        job: {
          id: true,
          filePath: true,
          status: true,
        },
        batchIndex: true,
        rowFrom: true,
        rowTo: true,
      },
    });

    if (!log) {
      throw new NotFoundException('Log not found');
    }

    if (log.job.status === EAttendanceImportStatus.COMPLETED) {
      throw new BadRequestException('Job is already completed');
    }

    const file = await this.cloudinaryService.getFile(log.job.filePath);

    const { csvData } = readExcelFile(file);

    const rows = this.convertAttendanceDataToObject(csvData);

    const totalBatches = Math.ceil(rows.length / CHUNK_SIZE);
    const done = new Set(
      Array.from({ length: totalBatches }, (_, i) => i).filter(
        (i) => i !== log.batchIndex,
      ),
    );

    const lastFailedByBatch = new Map([[log.batchIndex, log.id]]);

    void (async () => {
      try {
        await this.updateStatusJob(
          log.job.id,
          EAttendanceImportStatus.PROCESSING,
        );
        const status = await this.runBatch(
          rows,
          log.job.id,
          done,
          lastFailedByBatch,
        );

        const alsoFailedLogs = await this.attendanceImportLogsRepository.exists(
          {
            where: {
              jobId: log.job.id,
              status: EAttendanceImportLogStatus.FAILED,
              batchIndex: Not(log.batchIndex),
            },
          },
        );

        await this.updateStatusJob(
          log.job.id,
          alsoFailedLogs ? EAttendanceImportStatus.FAILED : status,
        );
      } catch (e) {
        await this.updateStatusJob(log.job.id, EAttendanceImportStatus.FAILED);
      }
    })();

    return {
      message: 'Attendance import job retried successfully',
      logId,
    };
  }

  private handleImportAttendance(rows: AttendanceImportRow[]) {
    const errorsMessages: AttendanceImportError[] = [];

    for (const row of rows) {
      const errors = this.validateAttendanceImportRow(row);
      if (errors.length > 0) {
        errorsMessages.push({
          rowIndex: row.rowIndex,
          errors,
        });
      }
    }

    return errorsMessages;
  }

  private validateAttendanceImportRow(row: AttendanceImportRow): string[] {
    const errors: string[] = [];

    if (!row.employeeId || Number.isNaN(row.employeeId))
      errors.push('employeeId is required');

    if (!row.workDate) errors.push('workDate is required');

    if (!row.checkIn) errors.push('checkIn is required');

    if (!row.checkOut) errors.push('checkOut is required');

    if (!row.status) errors.push('status is required');

    return errors;
  }

  private convertAttendanceDataToObject(
    data: string[][],
  ): AttendanceImportRow[] {
    return data
      .filter((row) => row.some((cell) => String(cell ?? '').trim() !== ''))
      .map((row, index) => {
        const checkIn =
          row[ATTENDANCE_IMPORT_COLUMNS.COLUMN_INDEXES.CHECK_IN]?.trim() ?? '';
        const checkOut =
          row[ATTENDANCE_IMPORT_COLUMNS.COLUMN_INDEXES.CHECK_OUT]?.trim() ?? '';
        const workDate =
          formatDate(
            row[ATTENDANCE_IMPORT_COLUMNS.COLUMN_INDEXES.WORK_DATE]?.trim(),
          ) ?? '';

        return {
          rowIndex: index + 1,
          employeeId: Number(
            row[ATTENDANCE_IMPORT_COLUMNS.COLUMN_INDEXES.EMPLOYEE_ID],
          ),
          workDate,
          checkIn,
          checkOut,
          status: row[
            ATTENDANCE_IMPORT_COLUMNS.COLUMN_INDEXES.STATUS
          ]?.trim() as EAttendanceStatus,
          workHours:
            checkIn && checkOut ? calculateWorkHours(checkIn, checkOut) : 0,
          recordType: EAttendanceRecordType.FROM_OLD_SYSTEM,
        };
      });
  }

  private async handleImportAttendanceBatch(
    rows: AttendanceImportRow[],
    jobId: number,
  ) {
    try {
      const successLogs = await this.attendanceImportLogsRepository.find({
        where: { jobId, status: EAttendanceImportLogStatus.SUCCESS },
      });

      const done = new Set(successLogs.map((l) => l.batchIndex));

      const failedLogs = await this.attendanceImportLogsRepository.find({
        where: { jobId, status: EAttendanceImportLogStatus.FAILED },
        order: { id: 'DESC' },
      });

      const lastFailedByBatch = new Map<number, number>();

      for (const log of failedLogs) {
        if (!lastFailedByBatch.has(log.batchIndex)) {
          lastFailedByBatch.set(log.batchIndex, log.id);
        }
      }

      const status = await this.runBatch(rows, jobId, done, lastFailedByBatch);
      await this.updateStatusJob(jobId, status);
    } catch (error: any) {
      this.sendProgress(jobId, 100, 0, 0, EAttendanceImportStatus.FAILED);
      this.attendanceImportProgressService.complete(jobId);
      await this.updateStatusJob(jobId, EAttendanceImportStatus.FAILED);
      console.log(error);
    }
  }

  private async runBatch(
    rows: AttendanceImportRow[],
    jobId: number,
    done: Set<number>,
    lastFailedByBatch: Map<number, number>,
  ) {
    let status: EAttendanceImportStatus = EAttendanceImportStatus.COMPLETED;

    const totalBatches = Math.ceil(rows.length / CHUNK_SIZE) || 0;
    let totalSuccess = 0;
    let totalError = 0;
    let processedBatches = done.size;

    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const batchIndex = i / CHUNK_SIZE;
      if (done.has(batchIndex)) continue;

      const chunk = rows.slice(i, i + CHUNK_SIZE);

      // const rowErrors: { rowIndex: number; reason: string }[] = [];

      let successCount = 0;
      let errorCount = 0;

      const dataLog = this.attendanceImportLogsRepository.create({
        jobId,
        batchIndex,
        rowFrom: i + 1,
        rowTo: Math.min(i + CHUNK_SIZE, rows.length),
        status: EAttendanceImportLogStatus.PROCESSING,
        retryOfLogId: lastFailedByBatch.get(batchIndex) ?? null,
      });

      await this.attendanceImportLogsRepository.save(dataLog);

      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        await queryRunner.manager
          .createQueryBuilder()
          .insert()
          .into(AttendanceEntity)
          .values(
            chunk.map((row) => ({
              employeeId: row.employeeId,
              workDate: row.workDate,
              checkIn: row.checkIn,
              checkOut: row.checkOut,
              workHours: row.workHours,
              status: row.status,
              recordType: row.recordType,
            })),
          )
          .orUpdate(
            ['check_in', 'check_out', 'work_hours', 'status', 'record_type'],
            ['employee_id', 'work_date'],
          )
          .updateEntity(false)
          .execute();
        await queryRunner.commitTransaction();
        successCount += chunk.length;
        await sleep(500); // delay 0.5s
      } catch (err: any) {
        await queryRunner.rollbackTransaction();
        dataLog.status = EAttendanceImportLogStatus.FAILED;
        dataLog.errorMessages = err?.message ?? String(err);
        status = EAttendanceImportStatus.FAILED;
        errorCount += chunk.length;
      } finally {
        await queryRunner.release();
      }

      // for (const row of chunk) {
      //   try {
      //     await this.attendanceRepository
      //       .createQueryBuilder()
      //       .insert()
      //       .into(AttendanceEntity)
      //       .values({
      //         employeeId: row.employeeId,
      //         workDate: row.workDate,
      //         checkIn: row.checkIn,
      //         checkOut: row.checkOut,
      //         workHours: row.workHours,
      //         status: row.status,
      //         recordType: row.recordType,
      //       })
      //       .orUpdate(
      //         ['check_in', 'check_out', 'work_hours', 'status', 'record_type'],
      //         ['employee_id', 'work_date'],
      //       )
      //       .updateEntity(false)
      //       .execute();
      //     successCount++;
      //   } catch (e: any) {
      //     errorCount++;
      //     rowErrors.push({
      //       rowIndex: row.rowIndex,
      //       reason: e?.message ?? String(e),
      //     });
      //     this.logger.error(e.message, e.stack);
      //   }
      // }

      // dataLog.successCount = successCount;
      // dataLog.errorCount = errorCount;
      // dataLog.errorMessages =
      //   rowErrors.length > 0 ? JSON.stringify(rowErrors) : null;
      // dataLog.status =
      //   errorCount === 0
      //     ? EAttendanceImportLogStatus.SUCCESS
      //     : EAttendanceImportLogStatus.FAILED;

      await this.attendanceImportLogsRepository.save(dataLog);

      totalSuccess += successCount;
      totalError += errorCount;
      processedBatches++;

      // if (errorCount > 0) {
      //   status = EAttendanceImportStatus.FAILED;
      // }
      const progress = Math.round((processedBatches / totalBatches) * 100);
      this.sendProgress(
        jobId,
        progress,
        totalSuccess,
        totalError,
        EAttendanceImportStatus.PROCESSING,
      );
    }

    this.sendProgress(jobId, 100, totalSuccess, totalError, status);
    this.attendanceImportProgressService.complete(jobId);
    return status;
  }

  async updateStatusJob(jobId: number, status: EAttendanceImportStatus) {
    // eslint-disable-next-line no-useless-catch
    try {
      await this.attendanceImportJobsRepository.update(jobId, { status });
    } catch (error) {
      throw error;
    }
  }

  private sendProgress(
    jobId: number,
    progress: number,
    totalSuccess: number,
    totalError: number,
    status: EAttendanceImportStatus,
  ) {
    this.attendanceImportProgressService.send(jobId, {
      jobId,
      progress,
      successCount: totalSuccess,
      errorCount: totalError,
      status,
    });
  }
}
