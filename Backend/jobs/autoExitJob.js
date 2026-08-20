const cron = require("node-cron");
const db = require("../db");

const AUTO_EXIT_SCHEDULE = "*/5 * * * *";
const EOD_EXIT_SCHEDULE = "30 17 * * 1-5"; // fires at exactly 17:30 on Mon-Fri (server clock = IST)
let autoExitTask = null;
let eodExitTask = null;
let isAutoExitRunning = false;

async function closeOpenVisits() {

  const [result] = await db.promise().query(
    `
    UPDATE library_logs

    SET 
        exit_time = NOW(),
        is_auto_exit = TRUE

    WHERE 
        exit_time IS NULL

        AND visit_date = CURDATE()

        AND
        (
            -- Rule 1: After 1 hour
            entry_time <= DATE_SUB(NOW(), INTERVAL 1 HOUR)

            OR

            -- Rule 2: After 5:00 PM
            TIME(NOW()) >= '17:00:00'
        )
    `
  );


  if (result.affectedRows > 0) {

    console.log(
      `🕒 Auto-exit closed ${result.affectedRows} visit(s).`
    );

  } else {

    console.log(
      "🕒 Auto-exit checked: no open visits found."
    );

  }
}

async function runAutoExitJob() {
  if (isAutoExitRunning) {
    console.log("🕒 Auto-exit skipped: previous run is still active.");
    return;
  }

  isAutoExitRunning = true;

  try {
    await closeOpenVisits();
  } catch (error) {
    console.error("❌ Auto-exit job failed:", error.sqlMessage || error.message || error);
  } finally {
    isAutoExitRunning = false;
  }
}

function startAutoExitJob() {
  if (autoExitTask) {
    console.log("🕒 Auto-exit job is already scheduled.");
    return autoExitTask;
  }

  autoExitTask = cron.schedule(AUTO_EXIT_SCHEDULE, async () => {
    try {
      await runAutoExitJob();
    } catch (error) {
      console.error("❌ Auto-exit scheduler failed:", error.message || error);
    }
  });

  // Compulsory end-of-day sweep: fires at exactly 17:30 on every working day.
  // Reuses runAutoExitJob() — no duplicate SQL or logic.
  eodExitTask = cron.schedule(EOD_EXIT_SCHEDULE, async () => {
    try {
      console.log("🕒 End-of-day sweep triggered at 17:30.");
      await runAutoExitJob();
    } catch (error) {
      console.error("❌ End-of-day exit job failed:", error.message || error);
    }
  });

  console.log("🕒 Auto-exit job scheduled every 5 minutes.");
  console.log("🕒 End-of-day exit scheduled at 17:30 on weekdays (IST).");
  runAutoExitJob();
  return autoExitTask;
}

module.exports = {
  closeOpenVisits,
  startAutoExitJob
};
