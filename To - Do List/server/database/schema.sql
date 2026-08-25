-- SQL Schema for Advanced To-Do List Application

CREATE DATABASE IF NOT EXISTS `todo_app` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `todo_app`;

-- Table 1: Users
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `phone` VARCHAR(20) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `avatar` VARCHAR(255) DEFAULT '⚡',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table 2: Categories / Projects
CREATE TABLE IF NOT EXISTS `categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT DEFAULT NULL,
  `name` VARCHAR(100) NOT NULL,
  `color` VARCHAR(30) DEFAULT '#6366f1',
  `icon` VARCHAR(50) DEFAULT 'folder',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table 3: Tasks
CREATE TABLE IF NOT EXISTS `tasks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT DEFAULT NULL,
  `category_id` INT DEFAULT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `status` ENUM('todo', 'in_progress', 'review', 'completed') DEFAULT 'todo',
  `priority` ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  `due_date` DATETIME DEFAULT NULL,
  `is_starred` TINYINT(1) DEFAULT 0,
  `is_pinned` TINYINT(1) DEFAULT 0,
  `estimated_minutes` INT DEFAULT 30,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table 4: Subtasks
CREATE TABLE IF NOT EXISTS `subtasks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `task_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `completed` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Default sample user
INSERT IGNORE INTO `users` (`id`, `name`, `email`, `phone`, `password`, `avatar`) VALUES
(1, 'Demo User', 'demo@example.com', '0771234567', '$2a$10$w8.B9Y2L/5Z8v7...demo', '🚀');

-- Default categories
INSERT IGNORE INTO `categories` (`id`, `user_id`, `name`, `color`, `icon`) VALUES
(1, 1, 'Work & Career', '#6366f1', 'briefcase'),
(2, 1, 'Personal Life', '#ec4899', 'heart'),
(3, 1, 'Tech & Code', '#10b981', 'code'),
(4, 1, 'Health & Fitness', '#f59e0b', 'activity');
