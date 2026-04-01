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

function buildVisitLogFilters(query) {
  const {
    visit_date,
    visitor_type,
    search,
    department,
    use_computer,
    status
  } = query;

  const baseQuery = `
    FROM library_logs ll
    LEFT JOIN students s
     ON ll.roll_no = s.roll_no
    WHERE 1 = 1
  `;

  let whereClause = "";
  const params = [];
  const hasExplicitVisitDate =
    typeof query.visit_date === "string" && query.visit_date.trim() !== "";

  // For "currently inside" queries, date should only be applied when the client
  // explicitly sends one. This keeps the logs aligned with the active-session count.
  if (hasExplicitVisitDate) {
    whereClause += " AND ll.visit_date = ?";
    params.push(visit_date);
  }

  if (visitor_type && visitor_type !== "all") {
    whereClause += " AND ll.visitor_type = ?";
    params.push(visitor_type.toLowerCase());
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
      SUM(visitor_type = 'sport') as sports,
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
      sports: result[0]?.sports || 0,
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
    status,
    page = 1,
    limit = 10
  } = req.query;

  const currentPage = Math.max(parseInt(page, 10) || 1, 1);
  const pageSize = Math.max(parseInt(limit, 10) || 10, 1);
  const offset = (currentPage - 1) * pageSize;
  const { baseQuery, whereClause, params } = buildVisitLogFilters(req.query);

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

    CASE 
      WHEN ll.visitor_type IN ('student', 'sport') THEN s.department
      ELSE NULL
    END AS department,

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
    const { baseQuery, whereClause, params } = buildVisitLogFilters(req.query);
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
