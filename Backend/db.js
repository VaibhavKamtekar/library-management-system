const mysql = require("mysql2");

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "nmitd_library"
});

async function fetchTableColumns(tableName) {
    const [columns] = await db.promise().query(
        `SELECT COLUMN_NAME, COLUMN_TYPE
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = ?
           AND TABLE_NAME = ?`,
        ["nmitd_library", tableName]
    );

    return columns;
}

async function ensureLibraryLogsSchema() {
    const dbPromise = db.promise();
    const columns = await fetchTableColumns("library_logs");

    const visitorTypeColumn = columns.find(
        (column) => column.COLUMN_NAME === "visitor_type"
    );
    const hasSportNameColumn = columns.some(
        (column) => column.COLUMN_NAME === "sport_name"
    );

    if (
        visitorTypeColumn &&
        !String(visitorTypeColumn.COLUMN_TYPE).includes("'sport'")
    ) {
        await dbPromise.query(
            "ALTER TABLE library_logs MODIFY COLUMN visitor_type ENUM('student','sport','staff','guest') NOT NULL"
        );
        console.log("✅ Updated library_logs.visitor_type to include sport");
    }

    if (!hasSportNameColumn) {
        await dbPromise.query(
            "ALTER TABLE library_logs ADD COLUMN sport_name VARCHAR(100) NULL AFTER roll_no"
        );
        console.log("✅ Added library_logs.sport_name column");
    }
}

async function ensureStudentLifecycleSchema() {
    const dbPromise = db.promise();
    const currentYear = new Date().getFullYear();
    let columns = await fetchTableColumns("students");

    if (columns.length === 0) {
        return;
    }

    const hasColumn = (columnName) =>
        columns.some((column) => column.COLUMN_NAME === columnName);

    if (hasColumn("department") && !hasColumn("course")) {
        await dbPromise.query(
            "ALTER TABLE students CHANGE COLUMN department course VARCHAR(50) NULL"
        );
        console.log("✅ Renamed students.department to course");
        columns = await fetchTableColumns("students");
    }

    if (hasColumn("year") && !hasColumn("academic_year")) {
        await dbPromise.query(
            "ALTER TABLE students CHANGE COLUMN year academic_year VARCHAR(10) NULL"
        );
        console.log("✅ Renamed students.year to academic_year");
        columns = await fetchTableColumns("students");
    }

    if (!hasColumn("admission_year")) {
        await dbPromise.query(
            "ALTER TABLE students ADD COLUMN admission_year INT NULL AFTER course"
        );
        console.log("✅ Added students.admission_year");
        columns = await fetchTableColumns("students");
    }

    if (!hasColumn("status")) {
        await dbPromise.query(
            "ALTER TABLE students ADD COLUMN status ENUM('active','inactive') NULL AFTER academic_year"
        );
        console.log("✅ Added students.status");
        columns = await fetchTableColumns("students");
    }

    if (hasColumn("active")) {
        await dbPromise.query(
            `UPDATE students
             SET status = CASE
               WHEN COALESCE(active, 1) = 1 THEN 'active'
               ELSE 'inactive'
             END
             WHERE status IS NULL OR status = ''`
        );
    } else {
        await dbPromise.query(
            `UPDATE students
             SET status = 'active'
             WHERE status IS NULL OR status = ''`
        );
    }

    await dbPromise.query(
        `UPDATE students
         SET admission_year = ?
         WHERE admission_year IS NULL
           AND UPPER(COALESCE(academic_year, '')) = 'FY'`,
        [currentYear]
    );
    await dbPromise.query(
        `UPDATE students
         SET admission_year = ?
         WHERE admission_year IS NULL
           AND UPPER(COALESCE(academic_year, '')) = 'SY'`,
        [currentYear - 1]
    );
    await dbPromise.query(
        `UPDATE students
         SET admission_year = ?
         WHERE admission_year IS NULL
           AND UPPER(COALESCE(academic_year, '')) NOT IN ('', 'FY', 'SY')`,
        [currentYear - 2]
    );
    await dbPromise.query(
        `UPDATE students
         SET admission_year = ?
         WHERE admission_year IS NULL`,
        [currentYear]
    );

    await dbPromise.query(
        `UPDATE students
         SET academic_year = 'SY',
             status = 'inactive'
         WHERE UPPER(COALESCE(academic_year, '')) NOT IN ('', 'FY', 'SY')`
    );
    await dbPromise.query(
        `UPDATE students
         SET academic_year = 'FY'
         WHERE academic_year IS NULL OR academic_year = ''`
    );

    await dbPromise.query(
        "ALTER TABLE students MODIFY COLUMN academic_year ENUM('FY','SY') NOT NULL"
    );
    await dbPromise.query(
        "ALTER TABLE students MODIFY COLUMN admission_year INT NOT NULL"
    );
    await dbPromise.query(
        "ALTER TABLE students MODIFY COLUMN status ENUM('active','inactive') NOT NULL DEFAULT 'active'"
    );

    await dbPromise.query(`
        CREATE TABLE IF NOT EXISTS student_lifecycle_meta (
            meta_id TINYINT PRIMARY KEY,
            last_promotion_failed_count INT NOT NULL DEFAULT 0,
            last_promotion_run_at DATETIME NULL
        )
    `);
    await dbPromise.query(
        `INSERT INTO student_lifecycle_meta (meta_id, last_promotion_failed_count, last_promotion_run_at)
         VALUES (1, 0, NULL)
         ON DUPLICATE KEY UPDATE meta_id = meta_id`
    );
    console.log("✅ Student lifecycle schema verified");
}

db.connect((err) => {
    if (err) {
        console.log("❌ Database connection failed:", err);
    } else {
        console.log("✅ MySQL Connected Successfully");
        ensureLibraryLogsSchema().catch((schemaErr) => {
            console.log("❌ Failed to update library_logs schema:", schemaErr);
        });
        ensureStudentLifecycleSchema().catch((schemaErr) => {
            console.log("❌ Failed to update students schema:", schemaErr);
        });
    }
});

module.exports = db;
