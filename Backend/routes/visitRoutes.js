const router = require("express").Router();
const db = require("../db");

router.post("/", async (req, res) => {
  const { type, use_computer, sport } = req.body;
  const dbPromise = db.promise();

  if (!type || !["student", "sport", "staff", "guest"].includes(type)) {
    return res.status(400).json({
      status: "ERROR",
      message: "Invalid visitor type.",
      data: {}
    });
  }

  try {
    let visitorName = "";
    let rollNo = null;
    let department = null;
    let sessionUseComputer = "NO";
    let sportName = null;
    let activeWhere = "";
    let activeParams = [];

    if (type === "student" || type === "sport") {
      const { roll_no } = req.body;

      if (!roll_no) {
        return res.status(400).json({
          status: "ERROR",
          message: "roll_no is required for student or sport visits.",
          data: {}
        });
      }

      if (type === "sport" && !sport) {
        return res.status(400).json({
          status: "ERROR",
          message: "sport is required for sport visits.",
          data: {}
        });
      }

      const [students] = await dbPromise.query(
        "SELECT name, department, roll_no FROM students WHERE roll_no = ?",
        [roll_no]
      );

      if (students.length === 0) {
        return res.status(404).json({
          status: "ERROR",
          message: "Student not found.",
          data: {}
        });
      }

      visitorName = students[0].name;
      department = students[0].department;
      rollNo = students[0].roll_no;
      sessionUseComputer = type === "student" ? use_computer || "NO" : "NO";
      sportName = type === "sport" ? sport : null;
      activeWhere = "roll_no = ? AND exit_time IS NULL";
      activeParams = [rollNo];
    }

    if (type === "staff") {
      const { staff_id } = req.body;

      if (!staff_id) {
        return res.status(400).json({
          status: "ERROR",
          message: "staff_id is required for staff visits.",
          data: {}
        });
      }

      const [staffRows] = await dbPromise.query(
        "SELECT staff_id, name FROM staff WHERE staff_id = ?",
        [staff_id]
      );

      if (staffRows.length === 0) {
        return res.status(404).json({
          status: "ERROR",
          message: "Staff member not found.",
          data: {}
        });
      }

      visitorName = staffRows[0].name;
      activeWhere = "visitor_type = 'staff' AND visitor_name = ? AND exit_time IS NULL";
      activeParams = [visitorName];
    }

    if (type === "guest") {
      const { guest_name } = req.body;

      if (!guest_name) {
        return res.status(400).json({
          status: "ERROR",
          message: "guest_name is required for guest visits.",
          data: {}
        });
      }

      visitorName = guest_name;
      activeWhere = "visitor_type = 'guest' AND visitor_name = ? AND exit_time IS NULL";
      activeParams = [visitorName];
    }

    const [activeSessions] = await dbPromise.query(
      `SELECT log_id, entry_time, visit_date FROM library_logs WHERE ${activeWhere}`,
      activeParams
    );

    if (activeSessions.length > 0) {
      if (rollNo) {
        await dbPromise.query(
          "UPDATE library_logs SET exit_time = NOW() WHERE roll_no = ? AND exit_time IS NULL",
          [rollNo]
        );
      } else {
        const sessionIds = activeSessions.map((session) => session.log_id);
        const placeholders = sessionIds.map(() => "?").join(",");

        await dbPromise.query(
          `UPDATE library_logs SET exit_time = NOW() WHERE log_id IN (${placeholders})`,
          sessionIds
        );
      }

      return res.status(200).json({
        status: "EXIT",
        message: `${type} exit recorded successfully.`,
        data: {
          type,
          visitor_name: visitorName,
          roll_no: rollNo,
          department,
          closed_sessions: activeSessions.length
        }
      });
    }

    if (type === "sport") {
      await dbPromise.query(
        `INSERT INTO library_logs
          (visitor_type, visitor_name, roll_no, entry_time, visit_date, use_computer, sport_name)
         VALUES
          ('student', ?, ?, NOW(), CURDATE(), 'NO', NULL),
          ('sport', ?, ?, NOW(), CURDATE(), 'NO', ?)`,
        [visitorName, rollNo, visitorName, rollNo, sportName]
      );
    } else {
      const insertValues = [
        type,
        visitorName,
        rollNo,
        sessionUseComputer,
        sportName
      ];

      await dbPromise.query(
        `INSERT INTO library_logs
          (visitor_type, visitor_name, roll_no, entry_time, visit_date, use_computer, sport_name)
         VALUES (?, ?, ?, NOW(), CURDATE(), ?, ?)`,
        insertValues
      );
    }

    return res.status(200).json({
      status: "ENTRY",
      message: `${type} entry recorded successfully.`,
      data: {
        type,
        visitor_name: visitorName,
        roll_no: rollNo,
        department,
        use_computer: type === "student" ? sessionUseComputer : null,
        sport: sportName
      }
    });
  } catch (error) {
    console.error("Visit route error:", error);
    return res.status(500).json({
      status: "ERROR",
      message: error.sqlMessage || "Unable to process visit request.",
      data: {}
    });
  }
});

module.exports = router;
