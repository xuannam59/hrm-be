-- Rename username -> display_name (giữ nguyên dữ liệu cũ)
ALTER TABLE `User` RENAME COLUMN `username` TO `display_name`;

-- Bỏ unique vì displayName không còn @unique trong schema
DROP INDEX `User_username_key` ON `User`;
