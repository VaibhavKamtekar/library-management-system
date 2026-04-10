const router = require("express").Router();
const db = require("../db");

function formatDuration(entryTime, exitTime) {
  const start = new Date(entryTime);
  const end = new Date(exitTime);
  const durationMs = Math.max(0, end.getTime() - start.getTime());
  const totalMinutes = Math.floor(durationMs / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `${days}d ${hours}h ${String(minutes).padStart(2, "0")}m`;
  }

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  }

  return `${totalMinutes}m`;
}

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
    let course = null;
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
        "SELECT name, course, roll_no, status FROM students WHERE roll_no = ?",
        [roll_no]
      );

      if (students.length === 0) {
        return res.status(404).json({
          status: "ERROR",
          message: "Student not found.",
          data: {}
        });
      }

      if (students[0].status !== "active") {
        return res.status(403).json({
          status: "ERROR",
          message: "Only active students are allowed for entry.",
          data: {}
        });
      }

      visitorName = students[0].name;
      course = students[0].course;
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
      `SELECT log_id, entry_time, visit_date
       FROM library_logs
       WHERE ${activeWhere}
       ORDER BY entry_time ASC, log_id ASC`,
      activeParams
    );

    if (activeSessions.length > 0) {
      const summarySession = activeSessions[0];

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

      const [closedSessionRows] = await dbPromise.query(
        `SELECT log_id, entry_time, exit_time
         FROM library_logs
         WHERE log_id = ?
         LIMIT 1`,
        [summarySession.log_id]
      );

      const closedSession = closedSessionRows[0];

      return res.status(200).json({
        status: "EXIT",
        message: `${type} exit recorded successfully.`,
        data: {
          type,
          visitor_name: visitorName,
          roll_no: rollNo,
          course,
          department: course,
          closed_sessions: activeSessions.length,
          entry_time: closedSession?.entry_time || summarySession.entry_time,
          exit_time: closedSession?.exit_time || null,
          duration:
            closedSession?.entry_time && closedSession?.exit_time
              ? formatDuration(closedSession.entry_time, closedSession.exit_time)
              : "0m",
          is_auto_exit: false
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
        course,
        department: course,
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
