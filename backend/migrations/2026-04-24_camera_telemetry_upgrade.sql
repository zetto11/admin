-- Run this on existing cctv_cam_db deployments to align DB with telemetry + camera management features.
USE `cctv_cam_db`;

-- 1) Ensure camera URL column can store full stream URLs.
ALTER TABLE `cameras`
  MODIFY COLUMN `ip_simulated` VARCHAR(255) NOT NULL;

-- 2) Enforce uniqueness for stable provisioning/update behavior.
ALTER TABLE `cameras`
  ADD UNIQUE KEY `uq_camera_name` (`name`),
  ADD UNIQUE KEY `uq_camera_ip` (`ip_simulated`);

-- 3) Ensure telemetry table exists.
CREATE TABLE IF NOT EXISTS `camera_telemetry` (
  `camera_id` INT PRIMARY KEY,
  `signal_percent` TINYINT UNSIGNED DEFAULT NULL,
  `uptime_hours` DECIMAL(12,3) DEFAULT NULL,
  `thermal_celsius` DECIMAL(5,2) DEFAULT NULL,
  `load_percent` TINYINT UNSIGNED DEFAULT NULL,
  `retain_days_remaining` INT UNSIGNED DEFAULT NULL,
  `storage_used_tb` DECIMAL(8,4) DEFAULT NULL,
  `storage_node_label` VARCHAR(50) DEFAULT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_telemetry_camera` FOREIGN KEY (`camera_id`) REFERENCES `cameras` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4) Backfill telemetry for cameras that don't have a row yet.
INSERT INTO `camera_telemetry`
(`camera_id`, `signal_percent`, `uptime_hours`, `thermal_celsius`, `load_percent`, `retain_days_remaining`, `storage_used_tb`, `storage_node_label`)
SELECT
  c.id,
  75,
  0.000,
  40.00,
  20,
  30,
  0.0005,
  'Sigma-1'
FROM `cameras` c
LEFT JOIN `camera_telemetry` ct ON ct.camera_id = c.id
WHERE ct.camera_id IS NULL;
