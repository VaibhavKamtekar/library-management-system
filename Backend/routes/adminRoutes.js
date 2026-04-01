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
const DATE_VALUE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidDateValue(value) {
  if (typeof value !== "string" || !DATE_VALUE_PATTERN.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const parsedDate = new Date(Date.UTC(year, month - 1, day));

  return (
    parsedDate.getUTCFullYear() === year &&
    parsedDate.getUTCMonth() === month - 1 &&
    parsedDate.getUTCDate() === day
  );
}

function normalizeVisitDateRange(query) {
  const legacyVisitDate =
    typeof query.visit_date === "string" ? query.visit_date.trim() : "";
  let fromDate =
    typeof query.fromDate === "string" ? query.fromDate.trim() : "";
  let toDate =
    typeof query.toDate === "string" ? query.toDate.trim() : "";

  if (!fromDate && !toDate && legacyVisitDate) {
    fromDate = legacyVisitDate;
    toDate = legacyVisitDate;
  }

  if (fromDate && !isValidDateValue(fromDate)) {
    return { error: "Invalid fromDate value." };
  }

  if (toDate && !isValidDateValue(toDate)) {
    return { error: "Invalid toDate value." };
  }

  if (fromDate && toDate && fromDate > toDate) {
    [fromDate, toDate] = [toDate, fromDate];
  }

  return { fromDate, toDate };
}

function buildVisitLogFilters(query) {
  const {
    visitor_type,
    search,
    department,
    use_computer,
    status
  } = query;
  const { fromDate, toDate, error } = normalizeVisitDateRange(query);

  const baseQuery = `
    FROM library_logs ll
    LEFT JOIN students s
      ON ll.visitor_type = 'student'
      AND ll.roll_no = s.roll_no
    WHERE 1 = 1
  `;

  let whereClause = "";
  const params = [];

  if (error) {
    return { error };
  }

  if (fromDate && toDate) {
    whereClause += " AND ll.visit_date BETWEEN ? AND ?";
    params.push(fromDate, toDate);
  } else if (fromDate) {
    whereClause += " AND ll.visit_date >= ?";
    params.push(fromDate);
  } else if (toDate) {
    whereClause += " AND ll.visit_date <= ?";
    params.push(toDate);
  }

  if (visitor_type && visitor_type !== "all") {
    whereClause += " AND ll.visitor_type = ?";
    params.push(visitor_type);
  }

  if (department && department !== "all") {
    whereClause += " AND s.department = ?";
    params.push(department);
  }

  if (use_computer && use_computer !== "all") {
    whereClause += " AND ll.use_computer = ?";
    params.push(use_computer);
  }

  if (status === "inside") {
    whereClause += " AND ll.exit_time IS NULL";
  }

  if (status === "exited") {
    whereClause += " AND ll.exit_time IS NOT NULL";
  }

  if (search) {
    whereClause += " AND (ll.visitor_name LIKE ? OR ll.roll_no LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }

  return { baseQuery, whereClause, params };
}

function toCsvValue(value) {
  if (value === null || value === undefined) return "";
  const stringValue = String(value).replace(/"/g, '""');
  return `"${stringValue}"`;
}

function getMonthlyFootfallData() {
  const query = `
    SELECT
      YEAR(visit_date) AS year,
      MONTH(visit_date) AS month,
      DATE_FORMAT(MIN(visit_date), '%b %Y') AS month_label,
      SUM(visitor_type = 'student') AS student_visits,
      SUM(visitor_type = 'staff') AS staff_visits,
      SUM(visitor_type = 'guest') AS guest_visits,
      COUNT(*) AS total_visits
    FROM library_logs
    WHERE visit_date IS NOT NULL
    GROUP BY YEAR(visit_date), MONTH(visit_date)
    ORDER BY YEAR(visit_date), MONTH(visit_date)
  `;

  return db.promise().query(query);
}

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
      SUM(visitor_type='student') AS total_students,
      SUM(visitor_type='student' AND use_computer='YES') AS computer_users,
      SUM(visitor_type='student' AND use_computer='NO') AS non_computer_users,
      SUM(visitor_type='student') AS students_today,
      SUM(visitor_type='staff') AS staff_today,
      SUM(visitor_type='guest') AS guests_today
    FROM library_logs
    WHERE visit_date = ?
  `;

  db.query(query, [today], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({
      total_students: result[0]?.total_students || 0,
      computer_users: result[0]?.computer_users || 0,
      non_computer_users: result[0]?.non_computer_users || 0,
      students_today: result[0]?.students_today || 0,
      staff_today: result[0]?.staff_today || 0,
      guests_today: result[0]?.guests_today || 0
    });
  });
});

/* =========================
   MONTHLY FOOTFALL SUMMARY
========================= */
router.get("/monthly-footfall", async (req, res) => {
  try {
    const [rows] = await getMonthlyFootfallData();

    res.json(
      rows.map((row) => ({
        year: row.year,
        month: row.month,
        month_label: row.month_label,
        total_students: row.student_visits || 0,
        total_staff: row.staff_visits || 0,
        total_guests: row.guest_visits || 0,
        total_visits: row.total_visits || 0
      }))
    );
  } catch (error) {
    return res.status(500).json({
      message: "Unable to load monthly footfall."
    });
  }
});

/* =========================
   MONTHLY FOOTFALL REPORT (EXCEL)
========================= */
router.get("/monthly-footfall-report", async (req, res) => {
  try {
    const [rows] = await getMonthlyFootfallData();
    const worksheetData = [
      [
        "Month",
        "Student Visits",
        "Staff Visits",
        "Guest Visits",
        "Total Visits"
      ],
      ...rows.map((row) => ([
        row.month_label,
        row.student_visits || 0,
        row.staff_visits || 0,
        row.guest_visits || 0,
        row.total_visits || 0
      ]))
    ];

    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.aoa_to_sheet(worksheetData);

    worksheet["!cols"] = [
      { wch: 18 },
      { wch: 16 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 }
    ];
    worksheet["!autofilter"] = {
      ref: `A1:E${Math.max(worksheetData.length, 1)}`
    };

    xlsx.utils.book_append_sheet(workbook, worksheet, "Monthly Footfall");

    const fileBuffer = xlsx.write(workbook, {
      type: "buffer",
      bookType: "xlsx"
    });
    const generatedOn = new Date().toISOString().slice(0, 10);

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="monthly-footfall-report-${generatedOn}.xlsx"`
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    return res.status(200).send(fileBuffer);
  } catch (error) {
    return res.status(500).json({
      message: "Unable to generate monthly footfall report."
    });
  }
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
   CURRENTLY INSIDE USERS
========================= */
router.get("/currently-inside", async (req, res) => {
  try {
    const dbPromise = db.promise();
    const [rows] = await dbPromise.query(`
      SELECT COUNT(*) AS count
      FROM library_logs
      WHERE exit_time IS NULL
    `);

    return res.json({
      count: rows[0]?.count || 0
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to load currently inside count."
    });
  }
});

/* =========================
   FILTERED VISIT LOGS
========================= */
router.get("/visit-logs", (req, res) => {
  const {
    page = 1,
    limit = 10
  } = req.query;

  const currentPage = Math.max(parseInt(page, 10) || 1, 1);
  const pageSize = Math.max(parseInt(limit, 10) || 10, 1);
  const offset = (currentPage - 1) * pageSize;
  const { baseQuery, whereClause, params, error } = buildVisitLogFilters(req.query);

  if (error) {
    return res.status(400).json({ message: error });
  }

  const countQuery = `
    SELECT COUNT(*) AS total
    ${baseQuery}
    ${whereClause}
  `;

  const dataQuery = `
    SELECT
      ll.log_id,
      ll.visitor_type,
      ll.visitor_name,
      ll.roll_no,
      s.department,
      ll.entry_time,
      ll.exit_time,
      ll.visit_date,
      ll.use_computer,
      CASE
        WHEN ll.exit_time IS NULL THEN 'Inside'
        ELSE 'Exited'
      END AS status
    ${baseQuery}
    ${whereClause}
    ORDER BY ll.entry_time DESC
    LIMIT ? OFFSET ?
  `;

  db.query(countQuery, params, (countErr, countResult) => {
    if (countErr) return res.status(500).json(countErr);

    const total = countResult[0]?.total || 0;
    const totalPages = Math.max(Math.ceil(total / pageSize), 1);

    db.query(dataQuery, [...params, pageSize, offset], (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({
        data: result,
        total,
        page: currentPage,
        totalPages
      });
    });
  });
});

/* =========================
   EXPORT FILTERED VISIT LOGS AS CSV
========================= */
router.get("/export-logs", async (req, res) => {
  try {
    const dbPromise = db.promise();
    const { baseQuery, whereClause, params, error } = buildVisitLogFilters(req.query);

    if (error) {
      return res.status(400).json({
        message: error
      });
    }

    const exportQuery = `
      SELECT
        ll.visitor_type,
        ll.visitor_name,
        ll.roll_no,
        ll.entry_time,
        ll.exit_time,
        ll.visit_date,
        ll.use_computer
      ${baseQuery}
      ${whereClause}
      ORDER BY ll.entry_time DESC
    `;

    const [rows] = await dbPromise.query(exportQuery, params);
    const headers = [
      "visitor_type",
      "visitor_name",
      "roll_no",
      "entry_time",
      "exit_time",
      "visit_date",
      "use_computer"
    ];

    const csvLines = [
      headers.join(","),
      ...rows.map((row) =>
        headers
          .map((header) =>
            toCsvValue(
              header === "exit_time" && row[header] === null
                ? "Still Inside"
                : row[header]
            )
          )
          .join(",")
      )
    ];

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="library_logs.csv"');
    return res.status(200).send(csvLines.join("\n"));
  } catch (error) {
    return res.status(500).json({
      message: "Unable to export visit logs."
    });
  }
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
