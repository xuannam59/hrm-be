import { MigrationInterface, QueryRunner } from 'typeorm';

export class AttendanceImport1786003659361 implements MigrationInterface {
  name = 'AttendanceImport1786003659361';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`attendances\` ADD \`record_type\` enum ('our-hrm', 'from_old_system') NOT NULL DEFAULT 'our-hrm'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`attendances\` DROP COLUMN \`record_type\``,
    );
  }
}
