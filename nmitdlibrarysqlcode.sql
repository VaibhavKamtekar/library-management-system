USE nmitd_library;


CREATE TABLE students (
    student_id INT AUTO_INCREMENT PRIMARY KEY,
    roll_no VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    course VARCHAR(50),
    admission_year INT NOT NULL,
    academic_year ENUM('FY','SY') NOT NULL,
    status ENUM('active','inactive') NOT NULL DEFAULT 'active',
    active BOOLEAN DEFAULT TRUE
);
CREATE TABLE library_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    visitor_type ENUM('student','sport','staff','guest') NOT NULL,
    visitor_name VARCHAR(100),
    roll_no VARCHAR(20),
    entry_time DATETIME,
    exit_time DATETIME,
    visit_date DATE
);

CREATE TABLE admin (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50),
    password VARCHAR(100)
);
INSERT INTO admin VALUES (1, 'admin', 'admin123');

CREATE TABLE staff (
    staff_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    active BOOLEAN DEFAULT TRUE
);


INSERT INTO staff (name, password) VALUES
('Staff1', 'staff123'),
('Staff2', 'staff123');
SELECT * FROM students;

INSERT INTO students (roll_no, name, course, admission_year, academic_year, status) VALUES
('FY101', 'Rahul Sharma', 'MCA', 2026, 'FY', 'active'),
('FY102', 'Priya Patel', 'MCA', 2026, 'FY', 'active'),
('FY103', 'Amit Verma', 'MBA', 2026, 'FY', 'active'),
('SY201', 'Sneha Kulkarni', 'MCA', 2025, 'SY', 'active'),
('SY202', 'Rohan Mehta', 'MBA', 2025, 'SY', 'active'),
('TY301', 'Ananya Singh', 'MCA', 2024, 'SY', 'inactive'),
('TY302', 'Karan Desai', 'MBA', 2024, 'SY', 'inactive'),
('TY303', 'Neha Joshi', 'MCA', 2024, 'SY', 'inactive');

ALTER TABLE library_logs
ADD COLUMN use_computer ENUM('YES','NO') DEFAULT 'NO';

ALTER TABLE library_logs
MODIFY COLUMN visitor_type ENUM('student','sport','staff','guest') NOT NULL;

ALTER TABLE library_logs
ADD COLUMN sport_name VARCHAR(100) NULL AFTER roll_no;

CREATE TABLE IF NOT EXISTS student_lifecycle_meta (
    meta_id TINYINT PRIMARY KEY,
    last_promotion_failed_count INT NOT NULL DEFAULT 0,
    last_promotion_run_at DATETIME NULL
);

INSERT INTO student_lifecycle_meta (meta_id, last_promotion_failed_count, last_promotion_run_at)
VALUES (1, 0, NULL);
