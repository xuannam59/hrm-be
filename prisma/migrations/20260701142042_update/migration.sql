/*
  Warnings:

  - You are about to drop the column `email` on the `Employee` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `Employee_email_key` ON `Employee`;

-- AlterTable
ALTER TABLE `Employee` DROP COLUMN `email`;
