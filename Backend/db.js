const mysql = require("mysql2");

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "nmitd_library"
});

async function ensureLibraryLogsSchema() {
    const dbPromise = db.promise();
    const [columns] = await dbPromise.query(
        `SELECT COLUMN_NAME, COLUMN_TYPE
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = ?
           AND TABLE_NAME = 'library_logs'
           AND COLUMN_NAME IN ('visitor_type', 'sport_name')`,
        ["nmitd_library"]
    );

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

db.connect((err) => {
    if (err) {
        console.log("❌ Database connection failed:", err);
    } else {
        console.log("✅ MySQL Connected Successfully");
        ensureLibraryLogsSchema().catch((schemaErr) => {
            console.log("❌ Failed to update library_logs schema:", schemaErr);
        });
    }
});

module.exports = db;
