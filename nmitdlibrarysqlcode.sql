USE nmitd_library;


CREATE TABLE students (
    student_id INT AUTO_INCREMENT PRIMARY KEY,
    roll_no VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    year VARCHAR(10),
    department VARCHAR(50),
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

INSERT INTO students (roll_no, name, year, department) VALUES
('FY101', 'Rahul Sharma', 'FY', 'MCA'),
('FY102', 'Priya Patel', 'FY', 'MCA'),
('FY103', 'Amit Verma', 'FY', 'MCA'),
('SY201', 'Sneha Kulkarni', 'SY', 'MCA'),
('SY202', 'Rohan Mehta', 'SY', 'MCA'),
('TY301', 'Ananya Singh', 'TY', 'MCA'),
('TY302', 'Karan Desai', 'TY', 'MCA'),
('TY303', 'Neha Joshi', 'TY', 'MCA');

ALTER TABLE library_logs
ADD COLUMN use_computer ENUM('YES','NO') DEFAULT 'NO';

ALTER TABLE library_logs
MODIFY COLUMN visitor_type ENUM('student','sport','staff','guest') NOT NULL;

ALTER TABLE library_logs
ADD COLUMN sport_name VARCHAR(100) NULL AFTER roll_no;
