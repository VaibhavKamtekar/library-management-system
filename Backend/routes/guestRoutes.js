const router = require("express").Router();
const db = require("../db");

router.post("/in", (req, res) => {
  db.query(
    `INSERT INTO library_logs
     (visitor_type, visitor_name, entry_time, visit_date)
     VALUES ('guest', ?, NOW(), CURDATE())`,
    [req.body.name],
    () => res.json({ message: "Guest IN recorded" })
  );
});

router.post("/out", (req, res) => {
  db.query(
    `UPDATE library_logs
     SET exit_time = NOW()
     WHERE visitor_name=? AND visitor_type='guest' AND exit_time IS NULL`,
    [req.body.name],
    () => res.json({ message: "Guest OUT recorded" })
  );
});

module.exports = router;
