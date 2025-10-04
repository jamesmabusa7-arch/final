CREATE TABLE `courses` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `code` varchar(50) NOT NULL,
  `lecturer_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
);

CREATE TABLE `feedback` (
  `id` int(11) NOT NULL,
  `report_id` int(11) NOT NULL,
  `student_id` int(11) DEFAULT NULL,
  `feedback` text DEFAULT NULL,
  `topic` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
);

CREATE TABLE `ratings` (
  `id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `report_id` int(11) NOT NULL,
  `rating` int(11) DEFAULT NULL CHECK (`rating` between 1 and 5),
  `feedback` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
);

CREATE TABLE `reports` (
  `id` int(11) NOT NULL,
  `faculty` varchar(255) NOT NULL,
  `class_name` varchar(255) NOT NULL,
  `week_of_reporting` varchar(50) DEFAULT NULL,
  `date_of_lecture` date DEFAULT NULL,
  `course_name` varchar(255) DEFAULT NULL,
  `course_code` varchar(50) DEFAULT NULL,
  `lecturer_name` varchar(255) DEFAULT NULL,
  `actual_present` int(11) DEFAULT NULL,
  `total_registered` int(11) DEFAULT NULL,
  `venue` varchar(255) DEFAULT NULL,
  `scheduled_time` varchar(50) DEFAULT NULL,
  `topic_taught` text DEFAULT NULL,
  `learning_outcomes` text DEFAULT NULL,
  `recommendations` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `prl_feedback` text DEFAULT NULL,
  `pl_feedback` text DEFAULT NULL
);

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('student','lecturer','prl','pl') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
);