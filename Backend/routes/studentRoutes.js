const router = require("express").Router();
const db = require("../db");

router.post("/in", (req, res) => {
  const { roll_no, use_computer } = req.body;

  db.query(
    "SELECT name, course, status FROM students WHERE roll_no=?",
    [roll_no],
    (err, result) => {
      if (err) {
        console.error("Student IN query error:", err);
        return res.status(500).json({ message: "Internal server error." });
      }

      if (result.length === 0)
        return res.status(404).json({ message: "Student not found" });

      if (result[0].status !== "active") {
        return res.status(403).json({ message: "Only active students are allowed for entry." });
      }

      db.query(
        `INSERT INTO library_logs 
         (visitor_type, visitor_name, roll_no, entry_time, visit_date, use_computer)
         VALUES ('student', ?, ?, NOW(), CURDATE(), ?)`,
        [result[0].name, roll_no, use_computer || "NO"],
        (insertErr) => {
          if (insertErr) {
            console.error("Student IN insert error:", insertErr);
            return res.status(500).json({ message: "Internal server error." });
          }
          return res.json({ message: "Student IN recorded" });
        }
      );
    }
  );
});

router.post("/validate", (req, res) => {
  const { roll_no } = req.body;

  db.query(
    "SELECT name, course, status FROM students WHERE roll_no=?",
    [roll_no],
    (err, result) => {
      if (err) {
        console.error("Student validate query error:", err);
        return res.status(500).json({ message: "Internal server error." });
      }

      if (result.length === 0) {
        return res.status(404).json({ message: "Student not found" });
      }

      if (result[0].status !== "active") {
        return res.status(403).json({ message: "Only active students are allowed for entry." });
      }

      db.query(
        "SELECT log_id FROM library_logs WHERE roll_no=? AND exit_time IS NULL LIMIT 1",
        [roll_no],
        (err2, activeSessions) => {
          if (err2) {
            console.error("Student validate active session query error:", err2);
            return res.status(500).json({ message: "Internal server error." });
          }

          res.json({
            name: result[0].name,
            course: result[0].course,
            department: result[0].course,
            is_inside: activeSessions.length > 0
          });
        }
      );
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
      if (err) {
        console.error("Student OUT update error:", err);
        return res.status(500).json({ message: "Internal server error." });
      }
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
    if (err) {
      console.error("Student leaderboard query error:", err);
      return res.status(500).json({ message: "Internal server error." });
    }
    res.json(result);
  });
});

router.get("/footfall", (req, res) => {
  const query = `
    SELECT
      COUNT(*) AS total_students,
      SUM(use_computer='YES') AS computer_users,
      SUM(use_computer='NO') AS non_computer_users
    FROM library_logs
    WHERE visitor_type='student'
    AND visit_date = CURDATE()
  `;

  db.query(query, (err, result) => {
    if (err) {
      console.error("Student footfall query error:", err);
      return res.status(500).json({ message: "Internal server error." });
    }
    res.json(result[0]);
  });
});

module.exports = router;
