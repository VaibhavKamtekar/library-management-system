const router = require("express").Router();
const db = require("../db");

/* =========================
   STAFF LOGIN
========================= */
router.post("/login", (req, res) => {
  const { name, password } = req.body;

  if (!name || !password) {
    return res.status(400).json({ success: false, message: "Missing credentials" });
  }

  db.query(
    "SELECT * FROM staff WHERE name=? AND password=?",
    [name, password],
    (err, result) => {
      if (err) return res.status(500).json({ success: false, message: "DB error" });
      res.json({ success: result.length > 0 });
    }
  );
});

router.post("/in", (req, res) => {
  db.query(
    `INSERT INTO library_logs
     (visitor_type, visitor_name, entry_time, visit_date)
     VALUES ('staff', ?, NOW(), CURDATE())`,
    [req.body.name],
    () => res.json({ message: "Staff IN recorded" })
  );
});

router.post("/out", (req, res) => {
  db.query(
    `UPDATE library_logs
     SET exit_time = NOW()
     WHERE visitor_name=? AND visitor_type='staff' AND exit_time IS NULL`,
    [req.body.name],
    () => res.json({ message: "Staff OUT recorded" })
  );
});

module.exports = router;
