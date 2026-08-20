const router = require("express").Router();
const db = require("../db");

router.post("/in", (req, res) => {
  db.query(
    `INSERT INTO library_logs
     (visitor_type, visitor_name, entry_time, visit_date)
     VALUES ('guest', ?, NOW(), CURDATE())`,
    [req.body.name],
    (err) => {
      if (err) return res.status(500).json({ error: "DB error", message: "Failed to record guest entry" });
      return res.json({ message: "Guest IN recorded" });
    }
  );
});

router.post("/out", (req, res) => {
  db.query(
    `UPDATE library_logs
     SET exit_time = NOW()
     WHERE visitor_name=? AND visitor_type='guest' AND exit_time IS NULL`,
    [req.body.name],
    (err) => {
      if (err) return res.status(500).json({ error: "DB error", message: "Failed to record guest exit" });
      return res.json({ message: "Guest OUT recorded" });
    }
  );
});

router.post("/validate", (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: "Name required" });

  db.query(
    "SELECT log_id FROM library_logs WHERE visitor_name=? AND visitor_type='guest' AND exit_time IS NULL LIMIT 1",
    [name],
    (err, activeSessions) => {
      if (err) return res.status(500).json({ error: "DB error" });
      res.json({ is_inside: activeSessions.length > 0 });
    }
  );
});

module.exports = router;
