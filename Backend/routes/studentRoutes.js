const router = require("express").Router();
const db = require("../db");

router.post("/in", (req, res) => {
  const { roll_no, use_computer } = req.body;

  db.query(
    "SELECT name, department FROM students WHERE roll_no=?",
    [roll_no],
    (err, result) => {
      if (err) return res.status(500).json(err);

      if (result.length === 0)
        return res.status(404).json({ message: "Student not found" });

      db.query(
        `INSERT INTO library_logs 
         (visitor_type, visitor_name, roll_no, entry_time, visit_date, use_computer)
         VALUES ('student', ?, ?, NOW(), CURDATE(), ?)`,
        [result[0].name, roll_no, use_computer || "NO"],
        (insertErr) => {
          if (insertErr) return res.status(500).json(insertErr);
          return res.json({ message: "Student IN recorded" });
        }
      );
    }
  );
});
router.post("/validate", (req, res) => {
  const { roll_no } = req.body;

  db.query(
    "SELECT name, department FROM students WHERE roll_no=?",
    [roll_no],
    (err, result) => {
      if (err) return res.status(500).json(err);

      if (result.length === 0) {
        return res.status(404).json({ message: "Student not found" });
      }

      res.json({
        name: result[0].name,
        department: result[0].department
      });
    }
  );
});

router.post("/out", (req, res) => {
  const { roll_no } = req.body;

  db.query(
    `UPDATE library_logs 
     SET exit_time = NOW()
     WHERE roll_no=? AND exit_time IS NULL`,
    [roll_no],
    (err) => {
      if (err) return res.status(500).json(err);
      return res.json({ message: "Student OUT recorded" });
    }
  );
});
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
    LIMIT 10
  `;

  db.query(query, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});
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

module.exports = router;
