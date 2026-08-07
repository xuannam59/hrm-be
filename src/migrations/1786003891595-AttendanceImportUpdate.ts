import { MigrationInterface, QueryRunner } from 'typeorm';

export class AttendanceImportUpdate1786003891595 implements MigrationInterface {
  name = 'AttendanceImportUpdate1786003891595';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`attendance_import_logs\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`job_id\` int NOT NULL, \`batch_index\` int NOT NULL, \`status\` enum ('PROCESSING', 'SUCCESS', 'FAILED', 'SKIPPED') NOT NULL DEFAULT 'PROCESSING', \`success_count\` int NOT NULL DEFAULT '0', \`error_count\` int NOT NULL DEFAULT '0', \`error_messages\` text NULL, \`retry_of_log_id\` int NULL, \`row_from\` int NOT NULL, \`row_to\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`attendance_import_jobs\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`file_name\` varchar(255) NOT NULL, \`file_hash\` varchar(255) NOT NULL, \`file_path\` varchar(255) NOT NULL, \`status\` enum ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED') NOT NULL, \`total_batches\` int NOT NULL, \`total_rows\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );

    await queryRunner.query(
      `ALTER TABLE \`attendance_import_logs\` ADD CONSTRAINT \`FK_338028525ab536fc1661db4c168\` FOREIGN KEY (\`job_id\`) REFERENCES \`attendance_import_jobs\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`attendance_import_logs\` ADD CONSTRAINT \`FK_0f7400bbdf638b87b3ce6d2207c\` FOREIGN KEY (\`retry_of_log_id\`) REFERENCES \`attendance_import_logs\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`attendance_import_logs\` DROP FOREIGN KEY \`FK_0f7400bbdf638b87b3ce6d2207c\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`attendance_import_logs\` DROP FOREIGN KEY \`FK_338028525ab536fc1661db4c168\``,
    );
    await queryRunner.query(`DROP TABLE \`attendance_import_jobs\``);
    await queryRunner.query(`DROP TABLE \`attendance_import_logs\``);
  }
}
