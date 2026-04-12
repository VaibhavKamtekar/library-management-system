const express = require("express");
const multer = require("multer");
const path = require("path");
const xlsx = require("xlsx");
const db = require("../db");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

const CURRENT_YEAR = new Date().getFullYear();
const ACCEPTED_EXTENSIONS = new Set([".csv", ".xlsx"]);

function getStudentQueryFilters(query) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.max(parseInt(query.limit, 10) || 10, 1);
  const offset = (page - 1) * limit;
  const whereParts = [];
  const params = [];

  if (query.academic_year && query.academic_year !== "all") {
    whereParts.push("academic_year = ?");
    params.push(String(query.academic_year).trim().toUpperCase());
  }

  if (query.course && query.course !== "all") {
    whereParts.push("course = ?");
    params.push(String(query.course).trim());
  }

  if (query.status && query.status !== "all") {
    whereParts.push("status = ?");
    params.push(String(query.status).trim().toLowerCase());
  }

  if (query.search) {
    const searchValue = `%${String(query.search).trim()}%`;
    whereParts.push("(roll_no LIKE ? OR name LIKE ?)");
    params.push(searchValue, searchValue);
  }

  const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : "";

  return {
    page,
    limit,
    offset,
    whereClause,
    params
  };
}

function normalizeColumnName(columnName) {
  return String(columnName || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function mapRowToStudent(row) {
  const mapped = {};

  Object.entries(row).forEach(([key, value]) => {
    const normalizedKey = normalizeColumnName(key);
    mapped[normalizedKey] = value;
  });

  return {
    roll_no: String(mapped.roll_no || mapped.rollno || "").trim(),
    name: String(mapped.name || "").trim(),
    course: String(mapped.course || "").trim(),
    admission_year: String(
      mapped.admission_year || mapped.admissionyear || ""
    ).trim()
  };
}

function parseAdmissionYear(value) {
  const parsed = Number.parseInt(String(value || "").trim(), 10);

  if (!Number.isInteger(parsed)) {
    return null;
  }

  return parsed;
}

function readWorkbookRows(file) {
  const workbook = xlsx.read(file.buffer, {
    type: "buffer"
  });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  return xlsx.utils.sheet_to_json(sheet, {
    defval: ""
  });
}

async function validateStudentUpload(file) {
  const rows = readWorkbookRows(file);
  const normalizedRows = rows.map(mapRowToStudent);
  const duplicateTracker = new Map();

  normalizedRows.forEach((row) => {
    if (!row.roll_no) {
      return;
    }

    const normalizedRoll = row.roll_no.toUpperCase();
    duplicateTracker.set(
      normalizedRoll,
      (duplicateTracker.get(normalizedRoll) || 0) + 1
    );
  });

  const uniqueRollNos = normalizedRows
    .map((row) => row.roll_no)
    .filter(Boolean)
    .map((rollNo) => rollNo.toUpperCase());
  const dedupedRollNos = Array.from(new Set(uniqueRollNos));

  let existingRollNos = new Set();

  if (dedupedRollNos.length > 0) {
    const placeholders = dedupedRollNos.map(() => "?").join(",");
    const [existingStudents] = await db.promise().query(
      `SELECT UPPER(roll_no) AS roll_no
       FROM students
       WHERE UPPER(roll_no) IN (${placeholders})`,
      dedupedRollNos
    );

    existingRollNos = new Set(existingStudents.map((student) => student.roll_no));
  }

  const previewRows = normalizedRows.map((row, index) => {
    const rowErrors = [];
    const admissionYear = parseAdmissionYear(row.admission_year);
    const normalizedRoll = row.roll_no.toUpperCase();

    if (!row.roll_no) rowErrors.push("Missing roll number");
    if (!row.name) rowErrors.push("Missing name");
    if (!row.course) rowErrors.push("Missing course");
    if (!row.admission_year) {
      rowErrors.push("Missing admission year");
    } else if (admissionYear === null) {
      rowErrors.push("Invalid admission year");
    } else if (admissionYear < 2000 || admissionYear > CURRENT_YEAR) {
      rowErrors.push("Admission year out of range");
    }

    if (row.roll_no && duplicateTracker.get(normalizedRoll) > 1) {
      rowErrors.push("Duplicate roll number in file");
    }

    if (row.roll_no && existingRollNos.has(normalizedRoll)) {
      rowErrors.push("Roll number already exists");
    }

    return {
      row_number: index + 2,
      roll_no: row.roll_no,
      name: row.name,
      course: row.course,
      admission_year: admissionYear ?? row.admission_year,
      academic_year: "FY",
      status: "active",
      is_valid: rowErrors.length === 0,
      errors: rowErrors
    };
  });

  return {
    totalRows: previewRows.length,
    validRows: previewRows.filter((row) => row.is_valid).length,
    invalidRows: previewRows.filter((row) => !row.is_valid).length,
    rows: previewRows
  };
}

async function getStudentStats() {
  const dbPromise = db.promise();
  const [countResult, metaResult, promotionResult] = await Promise.all([
    dbPromise.query(`
      SELECT
        COUNT(*) AS total_students,
        SUM(status = 'active') AS active_students,
        SUM(status = 'inactive') AS inactive_students
      FROM students
    `),
    dbPromise.query(`
      SELECT last_promotion_failed_count
      FROM student_lifecycle_meta
      WHERE meta_id = 1
      LIMIT 1
    `),
    dbPromise.query(`
      SELECT
        SUM(status = 'active' AND academic_year = 'FY') AS fy_students,
        SUM(status = 'active' AND academic_year = 'SY') AS sy_students
      FROM students
    `)
  ]);

  const [counts] = countResult;
  const [metaRows] = metaResult;
  const [promotionCandidates] = promotionResult;

  return {
    total: counts[0]?.total_students || 0,
    active: counts[0]?.active_students || 0,
    inactive: counts[0]?.inactive_students || 0,
    pending: metaRows[0]?.last_promotion_failed_count ?? 0,
    eligible: (promotionCandidates[0]?.fy_students || 0) + (promotionCandidates[0]?.sy_students || 0),
    fyEligible: promotionCandidates[0]?.fy_students || 0,
    syEligible: promotionCandidates[0]?.sy_students || 0
  };
}

async function getStudentLeaderboard() {
  const dbPromise = db.promise();
  const [rows] = await dbPromise.query(`
      SELECT
        s.roll_no,
        s.name AS name,
        s.name AS visitor_name,
        s.course,
        s.academic_year,
        COUNT(ll.roll_no) AS visits
      FROM library_logs ll
      JOIN students s ON ll.roll_no = s.roll_no
      WHERE ll.visitor_type = 'student'
      GROUP BY s.roll_no, s.name, s.course, s.academic_year
      ORDER BY visits DESC
      LIMIT 10
    `);

  return rows;
}

router.get("/students", async (req, res) => {
  try {
    const dbPromise = db.promise();
    const { page, limit, offset, whereClause, params } = getStudentQueryFilters(req.query);

    const [countRows] = await dbPromise.query(
      `SELECT COUNT(*) AS total
       FROM students
       ${whereClause}`,
      params
    );

    const [students] = await dbPromise.query(
      `SELECT
         roll_no,
         name,
         course,
         admission_year,
         academic_year,
         status
       FROM students
       ${whereClause}
       ORDER BY roll_no ASC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [courses] = await dbPromise.query(
      `SELECT DISTINCT course
       FROM students
       WHERE course IS NOT NULL AND course <> ''
       ORDER BY course ASC`
    );

    const total = countRows[0]?.total || 0;

    return res.json({
      data: students,
      total,
      page,
      totalPages: Math.max(Math.ceil(total / limit), 1),
      stats: await getStudentStats(),
      courses: courses.map((row) => row.course),
      leaderboard: await getStudentLeaderboard()
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to load students."
    });
  }
});

router.post("/students", async (req, res) => {
  const { roll_no, name, course, admission_year } = req.body;
  const normalizedRollNo = String(roll_no || "").trim();
  const normalizedName = String(name || "").trim();
  const normalizedCourse = String(course || "").trim();
  const parsedAdmissionYear = parseAdmissionYear(admission_year);

  if (!normalizedRollNo || !normalizedName || !normalizedCourse || parsedAdmissionYear === null) {
    return res.status(400).json({
      message: "roll_no, name, course, and admission_year are required."
    });
  }

  if (parsedAdmissionYear < 2000 || parsedAdmissionYear > CURRENT_YEAR) {
    return res.status(400).json({
      message: "Admission year is out of range."
    });
  }

  try {
    await db.promise().query(
      `INSERT INTO students
        (roll_no, name, course, admission_year, academic_year, status)
       VALUES (?, ?, ?, ?, 'FY', 'active')`,
      [normalizedRollNo, normalizedName, normalizedCourse, parsedAdmissionYear]
    );

    return res.status(201).json({
      message: "Student added successfully."
    });
  } catch (error) {
    const duplicateRollNo = error.code === "ER_DUP_ENTRY";

    return res.status(duplicateRollNo ? 400 : 500).json({
      message: duplicateRollNo
        ? "Roll number already exists."
        : "Unable to add student."
    });
  }
});

router.post("/upload-students", upload.single("file"), async (req, res) => {
  const mode = String(req.body.mode || "confirm").trim().toLowerCase();

  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded." });
  }

  const extension = path.extname(req.file.originalname || "").toLowerCase();

  if (!ACCEPTED_EXTENSIONS.has(extension)) {
    return res.status(400).json({
      message: "Only .csv and .xlsx files are allowed."
    });
  }

  try {
    const preview = await validateStudentUpload(req.file);

    if (mode === "preview") {
      return res.json(preview);
    }

    const validRows = preview.rows.filter((row) => row.is_valid);

    if (validRows.length > 0) {
      const insertValues = validRows.map((row) => [
        row.roll_no,
        row.name,
        row.course,
        row.admission_year
      ]);

      await db.promise().query(
        `INSERT INTO students
          (roll_no, name, course, admission_year, academic_year, status)
         VALUES ?`,
        [insertValues.map((row) => [...row, "FY", "active"])]
      );
    }

    return res.json({
      message:
        preview.invalidRows > 0
          ? `${validRows.length} students uploaded successfully. ${preview.invalidRows} rows skipped.`
          : `${validRows.length} students uploaded successfully.`,
      totalRows: preview.totalRows,
      inserted: validRows.length,
      skipped: preview.invalidRows,
      rows: preview.rows
    });
  } catch (error) {
    return res.status(500).json({
      message: "Student upload failed."
    });
  }
});

router.post("/students/promote", async (req, res) => {
  const rollNos = Array.isArray(req.body.rollNos)
    ? Array.from(
        new Set(
          req.body.rollNos
            .map((rollNo) => String(rollNo || "").trim())
            .filter(Boolean)
        )
      )
    : [];

  const dbPromise = db.promise();
  let transactionStarted = false;

  try {
    let eligibleRows = [];
    let requestedCount = 0;

    if (rollNos.length > 0) {
      requestedCount = rollNos.length;
      const placeholders = rollNos.map(() => "?").join(",");
      const [selectedRows] = await dbPromise.query(
        `SELECT roll_no, academic_year, status
         FROM students
         WHERE roll_no IN (${placeholders})`,
        rollNos
      );

      eligibleRows = selectedRows.filter(
        (student) =>
          student.status === "active" &&
          ["FY", "SY"].includes(student.academic_year)
      );
    } else {
      const [allEligibleRows] = await dbPromise.query(
        `SELECT roll_no, academic_year
         FROM students
         WHERE status = 'active'
           AND academic_year IN ('FY', 'SY')`
      );
      eligibleRows = allEligibleRows;
      requestedCount = eligibleRows.length;
    }

    const fyRollNos = eligibleRows
      .filter((student) => student.academic_year === "FY")
      .map((student) => student.roll_no);
    const syRollNos = eligibleRows
      .filter((student) => student.academic_year === "SY")
      .map((student) => student.roll_no);
    const failedOrSkipped = Math.max(requestedCount - eligibleRows.length, 0);

    await dbPromise.beginTransaction();
    transactionStarted = true;

    if (fyRollNos.length > 0) {
      const placeholders = fyRollNos.map(() => "?").join(",");
      await dbPromise.query(
        `UPDATE students
         SET academic_year = 'SY'
         WHERE roll_no IN (${placeholders})`,
        fyRollNos
      );
    }

    if (syRollNos.length > 0) {
      const placeholders = syRollNos.map(() => "?").join(",");
      await dbPromise.query(
        `UPDATE students
         SET status = 'inactive'
         WHERE roll_no IN (${placeholders})`,
        syRollNos
      );
    }

    await dbPromise.query(
      `UPDATE student_lifecycle_meta
       SET last_promotion_failed_count = ?,
           last_promotion_run_at = NOW()
       WHERE meta_id = 1`,
      [failedOrSkipped]
    );

    await dbPromise.commit();

    return res.json({
      message: "Promotion completed successfully.",
      promotedToSY: fyRollNos.length,
      movedToInactive: syRollNos.length,
      failedOrSkipped
    });
  } catch (error) {
    if (transactionStarted) {
      try {
        await dbPromise.rollback();
      } catch (rollbackError) {
        // no-op
      }
    }

    return res.status(500).json({
      message: "Unable to promote students."
    });
  }
});

router.patch("/students/:rollNo/deactivate", async (req, res) => {
  try {
    const dbPromise = db.promise();
    const [rows] = await dbPromise.query(
      `SELECT status
       FROM students
       WHERE roll_no = ?
       LIMIT 1`,
      [req.params.rollNo]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Student not found."
      });
    }

    if (rows[0].status === "inactive") {
      return res.status(400).json({
        message: "Student is already inactive."
      });
    }

    await dbPromise.query(
      `UPDATE students
       SET status = 'inactive'
       WHERE roll_no = ?`,
      [req.params.rollNo]
    );

    return res.json({
      message: "Student deactivated successfully."
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to deactivate student."
    });
  }
});

router.delete("/students/:rollNo", async (req, res) => {
  try {
    const dbPromise = db.promise();
    const [rows] = await dbPromise.query(
      `SELECT status
       FROM students
       WHERE roll_no = ?
       LIMIT 1`,
      [req.params.rollNo]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Student not found."
      });
    }

    if (rows[0].status !== "inactive") {
      return res.status(400).json({
        message: "Active students cannot be deleted."
      });
    }

    await dbPromise.query(
      "DELETE FROM students WHERE roll_no = ?",
      [req.params.rollNo]
    );

    return res.json({
      message: "Student deleted successfully."
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to delete student."
    });
  }
});

router.delete("/logs/inactive", async (req, res) => {
  try {
    const [result] = await db.promise().query(
      `DELETE ll
       FROM library_logs ll
       INNER JOIN students s
         ON ll.roll_no = s.roll_no
       WHERE s.status = 'inactive'`
    );

    return res.json({
      message: "Inactive student logs deleted successfully.",
      deletedLogs: result.affectedRows || 0
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to delete inactive student logs."
    });
  }
});

module.exports = router;
