const router = require("express").Router();
const db = require("../db");

router.get("/", (req, res) => {
  const query = String(req.query.query || req.query.search || "").trim();

  if (query) {
    db.query(
      "SELECT staff_id, name FROM staff WHERE name LIKE ? ORDER BY name LIMIT 10",
      [`%${query}%`],
      (err, results) => {
        if (err) {
          console.error("Staff search DB error:", err);
          return res.status(500).json({ error: "DB error", message: "Failed to search staff" });
        }

        console.log(`[Staff Search] Query: "${query}" - Found ${results.length} results`);

        const response = results.map((row) => ({
          staff_id: row.staff_id,
          name: row.name,
          department: row.department || null,
          designation: row.designation || null
        }));

        res.json(response);
      }
    );
  } else {
    db.query(
      "SELECT staff_id, name FROM staff ORDER BY name ASC",
      (err, results) => {
        if (err) {
          console.error("DB ERROR:", err);
          return res.status(500).json({ error: "DB error" });
        }

        res.json(results);
      }
    );
  }
});

router.post("/login", (req, res) => {
  const rawStaffId = String(req.body?.staffId ?? "").trim();
  const password = String(req.body?.password ?? "").trim();
  const staffId = Number.parseInt(rawStaffId, 10);

  if (!rawStaffId || !password || Number.isNaN(staffId)) {
    return res
      .status(400)
      .json({ success: false, message: "Missing credentials" });
  }

  db.query(
    "SELECT staff_id, name, password FROM staff WHERE staff_id = ?",
    [staffId],
    (err, results) => {
      if (err) {
        return res
          .status(500)
          .json({ success: false, message: "DB error" });
      }

      if (results.length === 0) {
        return res.json({ success: false, message: "Invalid credentials" });
      }

      const staff = results[0];
      const storedPassword = String(staff.password ?? "").trim();

      if (storedPassword !== password) {
        return res.json({ success: false, message: "Invalid credentials" });
      }

      db.query(
        "SELECT log_id FROM library_logs WHERE visitor_name=? AND visitor_type='staff' AND exit_time IS NULL LIMIT 1",
        [staff.name],
        (err2, activeSessions) => {
          if (err2) {
            return res.status(500).json({ success: false, message: "DB error" });
          }

          res.json({
            success: true,
            staff: {
              staff_id: staff.staff_id,
              name: staff.name,
              is_inside: activeSessions.length > 0
            }
          });
        }
      );
    }
  );
});

router.post("/in", (req, res) => {
  db.query(
    `INSERT INTO library_logs
     (visitor_type, visitor_name, entry_time, visit_date)
     VALUES ('staff', ?, NOW(), CURDATE())`,
    [req.body.name],
    (err) => {
      if (err) return res.status(500).json({ error: "DB error", message: "Failed to record staff entry" });
      return res.json({ message: "Staff IN recorded" });
    }
  );
});

router.post("/out", (req, res) => {
  db.query(
    `UPDATE library_logs
     SET exit_time = NOW()
     WHERE visitor_name = ? AND visitor_type = 'staff' AND exit_time IS NULL`,
    [req.body.name],
    (err) => {
      if (err) return res.status(500).json({ error: "DB error", message: "Failed to record staff exit" });
      return res.json({ message: "Staff OUT recorded" });
    }
  );
});

module.exports = router;
