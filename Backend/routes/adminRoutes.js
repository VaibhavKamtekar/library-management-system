const express = require("express");
const router = express.Router();
const db = require("../db");

const multer = require("multer");
const xlsx = require("xlsx");
const path = require("path");

/* =========================
   MULTER CONFIG
========================= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

/* =========================
   ADMIN LOGIN
========================= */
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  db.query(
    "SELECT * FROM admin WHERE username=? AND password=?",
    [username, password],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ success: result.length > 0 });
    }
  );
});

/* =========================
   ADMIN DASHBOARD (TODAY COUNTS)
========================= */
router.get("/dashboard", (req, res) => {
  const today = new Date().toISOString().slice(0, 10);

  const query = `
    SELECT
      COUNT(*) AS total,
      SUM(visitor_type='student') AS students,
      SUM(visitor_type='staff') AS staff,
      SUM(visitor_type='guest') AS guests
    FROM library_logs
    WHERE visit_date = ?
  `;

  db.query(query, [today], (err, result) => {
    if (err) return res.status(500).json(err);

    res.json({
      total: result[0]?.total || 0,
      students: result[0]?.students || 0,
      staff: result[0]?.staff || 0,
      guests: result[0]?.guests || 0
    });
  });
});

/* =========================
   STUDENT LEADERBOARD (BY VISITS)
========================= */
router.get("/leaderboard", (req, res) => {
  const query = `
    SELECT 
      roll_no,
      visitor_name,
      COUNT(*) AS visits
    FROM library_logs
    WHERE visitor_type='student'
    GROUP BY roll_no, visitor_name
    ORDER BY visits DESC
  `;

  db.query(query, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

/* =========================
   TODAY FOOTFALL + COMPUTER USAGE
========================= */
router.get("/footfall", (req, res) => {
  const today = new Date().toISOString().slice(0, 10);

  const query = `
    SELECT
      COUNT(*) AS total_students,
      SUM(use_computer='YES') AS computer_users,
      SUM(use_computer='NO') AS non_computer_users
    FROM library_logs
    WHERE visitor_type='student'
    AND visit_date = ?
  `;

  db.query(query, [today], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result[0]);
  });
});

/* =========================
   MONTHLY STUDENT FOOTFALL
========================= */
router.get("/monthly-footfall", (req, res) => {
  const query = `
    SELECT 
      MONTH(visit_date) AS month,
      COUNT(*) AS total_students
    FROM library_logs
    WHERE visitor_type='student'
    GROUP BY MONTH(visit_date)
    ORDER BY month
  `;

  db.query(query, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

/* =========================
   STUDENT TIME SPENT TODAY
========================= */
router.get("/student-time-today", (req, res) => {
  const query = `
    SELECT 
      roll_no,
      visitor_name,
      SUM(TIMESTAMPDIFF(MINUTE, entry_time, exit_time)) AS minutes_spent
    FROM library_logs
    WHERE visitor_type='student'
      AND visit_date = CURDATE()
      AND exit_time IS NOT NULL
    GROUP BY roll_no, visitor_name
    ORDER BY minutes_spent DESC
  `;

  db.query(query, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

/* =========================
   TOTAL TIME SPENT TODAY (ALL USERS)
========================= */
router.get("/total-time-today", (req, res) => {
  const query = `
    SELECT 
      SUM(TIMESTAMPDIFF(MINUTE, entry_time, exit_time)) AS total_minutes
    FROM library_logs
    WHERE visit_date = CURDATE()
      AND exit_time IS NOT NULL
  `;

  db.query(query, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result[0]);
  });
});

/* =========================
   PEAK HOUR (STUDENT ENTRIES)
========================= */
router.get("/peak-hour", (req, res) => {
  const query = `
    SELECT 
      HOUR(entry_time) AS hour,
      COUNT(*) AS total_entries
    FROM library_logs
    WHERE visitor_type='student'
    GROUP BY HOUR(entry_time)
    ORDER BY total_entries DESC
    LIMIT 1
  `;

  db.query(query, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result[0]);
  });
});

/* =========================
   ADMIN – UPLOAD STUDENTS FROM EXCEL
========================= */
router.post("/upload-students", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    let inserted = 0;

    sheetData.forEach((row) => {
      const { roll_no, name, year, department } = row;
      if (!roll_no || !name) return;

      const query = `
        INSERT IGNORE INTO students (roll_no, name, year, department)
        VALUES (?, ?, ?, ?)
      `;
      db.query(query, [roll_no, name, year, department]);
      inserted++;
    });

    res.json({
      message: "Excel uploaded successfully",
      totalRows: sheetData.length,
      inserted
    });
  } catch (err) {
    res.status(500).json({ error: "Excel upload failed" });
  }
});

/* =========================
   EXPORT ROUTER
========================= */
module.exports = router;
